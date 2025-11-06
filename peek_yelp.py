import json
import os
from pathlib import Path

def peek_yelp_files(folder_path, output_file="yelp_structure.txt", num_lines=2):
    """Show first few lines of each JSON file in folder and write to output file"""
    folder = Path(folder_path)

    with open(output_file, 'w', encoding='utf-8') as out:
        for file in sorted(folder.glob('*.json')):
            out.write(f"\n{'='*60}\n")
            out.write(f"FILE: {file.name}\n")
            out.write('='*60 + '\n')

            with open(file, 'r', encoding='utf-8') as f:
                for i, line in enumerate(f):
                    if i >= num_lines:
                        break
                    try:
                        data = json.loads(line)
                        out.write(f"\nLine {i+1} (formatted):\n")
                        out.write(json.dumps(data, indent=2) + '\n')
                    except json.JSONDecodeError:
                        out.write(f"\nLine {i+1} (raw):\n")
                        out.write(line + '\n')

            # Show file size
            size_mb = file.stat().st_size / (1024 * 1024)
            out.write(f"\nFile size: {size_mb:.2f} MB\n")

    print(f"Output written to: {output_file}")

if __name__ == "__main__":
    # UPDATE THIS PATH to your Yelp dataset folder
    folder_path = r"C:\path\to\yelp_dataset"

    peek_yelp_files(folder_path)
