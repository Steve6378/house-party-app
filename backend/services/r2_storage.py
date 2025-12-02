# Yorru - Cloudflare R2 Storage Service
# Version: 0.0.1

import boto3
from botocore.config import Config
from typing import Optional, Union, BinaryIO
from io import BytesIO
import uuid
import os

from config import settings


class R2Storage:
    """
    Cloudflare R2 storage service (S3-compatible).
    Falls back to local storage if R2 is not configured.
    """

    def __init__(self):
        self.use_r2 = all([
            settings.R2_ACCOUNT_ID,
            settings.R2_ACCESS_KEY_ID,
            settings.R2_SECRET_ACCESS_KEY
        ])

        if self.use_r2:
            self.s3_client = boto3.client(
                's3',
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(
                    signature_version='s3v4',
                    retries={'max_attempts': 3}
                ),
                region_name='auto'
            )
            self.bucket_name = settings.R2_BUCKET_NAME
            self.public_url = settings.R2_PUBLIC_URL
            print(f"R2 Storage initialized with bucket: {self.bucket_name}")
        else:
            self.s3_client = None
            self.bucket_name = None
            self.public_url = None
            print("R2 not configured, using local storage fallback")

    def upload_file(
        self,
        file_data: Union[bytes, BinaryIO],
        event_id: str,
        file_ext: str,
        content_type: str
    ) -> dict:
        """
        Upload a file to R2 or local storage.

        Args:
            file_data: Either raw bytes or a file-like object with .read() method
            event_id: Event ID for organizing files
            file_ext: File extension (e.g., '.jpg', '.png')
            content_type: MIME type of the file

        Returns:
            dict with 'file_path' (R2 key or local path) and 'public_url' if available
        """
        # Generate unique filename
        file_id = str(uuid.uuid4())
        # Ensure file_ext starts with a dot
        if not file_ext.startswith('.'):
            file_ext = f".{file_ext}"
        filename = f"{file_id}{file_ext}"
        key = f"photos/{event_id}/{filename}"

        # Convert to bytes if needed
        if isinstance(file_data, bytes):
            data_bytes = file_data
        else:
            data_bytes = file_data.read()

        if self.use_r2:
            # Upload to R2 using put_object (works with bytes directly)
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=data_bytes,
                ContentType=content_type
            )

            # Generate public URL if configured
            public_url = None
            if self.public_url:
                public_url = f"{self.public_url.rstrip('/')}/{key}"

            return {
                'file_id': file_id,
                'file_path': key,  # R2 object key
                'public_url': public_url,
                'storage_type': 'r2'
            }
        else:
            # Fallback to local storage
            local_dir = f"uploads/photos/{event_id}"
            os.makedirs(local_dir, exist_ok=True)
            local_path = f"{local_dir}/{filename}"

            with open(local_path, 'wb') as f:
                f.write(data_bytes)

            return {
                'file_id': file_id,
                'file_path': local_path,
                'public_url': None,
                'storage_type': 'local'
            }

    def get_file(self, file_path: str) -> Optional[bytes]:
        """
        Get a file from R2 or local storage.

        Returns:
            File bytes or None if not found
        """
        if self.use_r2:
            try:
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=file_path
                )
                return response['Body'].read()
            except self.s3_client.exceptions.NoSuchKey:
                return None
            except Exception as e:
                print(f"Error getting file from R2: {e}")
                return None
        else:
            # Local storage
            if os.path.exists(file_path):
                with open(file_path, 'rb') as f:
                    return f.read()
            return None

    def get_presigned_url(self, file_path: str, expires_in: int = 3600) -> Optional[str]:
        """
        Generate a presigned URL for direct access to the file.

        Args:
            file_path: R2 object key or local path
            expires_in: URL expiration time in seconds (default 1 hour)

        Returns:
            Presigned URL or None if not using R2
        """
        if not self.use_r2:
            return None

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': file_path
                },
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            print(f"Error generating presigned URL: {e}")
            return None

    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from R2 or local storage.

        Returns:
            True if deleted successfully, False otherwise
        """
        if self.use_r2:
            try:
                self.s3_client.delete_object(
                    Bucket=self.bucket_name,
                    Key=file_path
                )
                return True
            except Exception as e:
                print(f"Error deleting file from R2: {e}")
                return False
        else:
            # Local storage
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
                return True
            except Exception as e:
                print(f"Error deleting local file: {e}")
                return False

    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get file metadata from R2.

        Returns:
            dict with file info or None if not found
        """
        if not self.use_r2:
            if os.path.exists(file_path):
                return {
                    'size': os.path.getsize(file_path),
                    'storage_type': 'local'
                }
            return None

        try:
            response = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=file_path
            )
            return {
                'size': response['ContentLength'],
                'content_type': response.get('ContentType'),
                'last_modified': response.get('LastModified'),
                'storage_type': 'r2'
            }
        except Exception:
            return None


# Singleton instance
r2_storage = R2Storage()
