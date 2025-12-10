Upload Release Assets (Windows PowerShell)
---------------------------------------

This folder contains `upload-release-assets.ps1` — a PowerShell helper to upload the built installer, its `.blockmap`, and `latest.yml` to the GitHub Release for tag `v1.2.3`.

Prerequisites
- PowerShell 5.1+ (Windows)
- A GitHub token with `repo` scope (keep it private)

Quick commands

- Set token in the current PowerShell session (recommended):
  ```powershell
  $env:GITHUB_TOKEN = 'ghp_...'
  ```

- Run the upload script from repository root:
  ```powershell
  .\scripts\upload-release-assets.ps1
  ```

- Or pass token explicitly (not recommended):
  ```powershell
  .\scripts\upload-release-assets.ps1 -Token 'ghp_...'
  ```

What the script does
- Reads `release/latest.yml` to determine the installer filename (`path`).
- Uploads the installer, the `.blockmap` (if present), and `latest.yml` to the GitHub Release `v1.2.3`.
- If an asset with the same name already exists, it deletes it first to avoid duplicates.
- Verifies the `latest.yml` download URL after upload (best-effort HEAD request).

If you'd like, I can run the script here — but I need the `GITHUB_TOKEN` or for you to set it in the terminal and allow me to run it. Alternatively, you can run the script locally following the steps above.
