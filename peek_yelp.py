import json
import os
from pathlib import Path

def peek_yelp_files(folder_path, num_lines=2):
    """Show first few lines of each JSON file in folder"""
    folder = Path(folder_path)

    for file in sorted(folder.glob('*.json')):
        print(f"\n{'='*60}")
        print(f"FILE: {file.name}")
        print('='*60)

        with open(file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if i >= num_lines:
                    break
                try:
                    data = json.loads(line)
                    print(f"\nLine {i+1} (formatted):")
                    print(json.dumps(data, indent=2))
                except json.JSONDecodeError:
                    print(f"\nLine {i+1} (raw):")
                    print(line)

        # Show file size
        size_mb = file.stat().st_size / (1024 * 1024)
        print(f"\nFile size: {size_mb:.2f} MB")

if __name__ == "__main__":
    # UPDATE THIS PATH to your Yelp dataset folder
    folder_path = r"C:\path\to\yelp_dataset"

    peek_yelp_files(folder_path)
