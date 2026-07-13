from __future__ import annotations

import bz2
import hashlib
import json
import shutil
from pathlib import Path

EXPECTED_SHA256 = "478e88929bb9efd35eff9f3b143da9ecbcc05550000bfcbc8103629ffa654482"

root = Path(__file__).resolve().parents[2]
payload_path = root / "tools" / "bootstrap" / "payload.bz2"
raw_payload = bz2.decompress(payload_path.read_bytes())
actual_sha256 = hashlib.sha256(raw_payload).hexdigest()
if actual_sha256 != EXPECTED_SHA256:
    raise RuntimeError(
        f"Bootstrap payload checksum mismatch: {actual_sha256} != {EXPECTED_SHA256}"
    )

files: dict[str, str] = json.loads(raw_payload.decode("utf-8"))
for relative_path, content in files.items():
    destination = root / relative_path
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(content, encoding="utf-8")

shutil.rmtree(root / "tools" / "bootstrap")
(root / ".github" / "workflows" / "bootstrap.yml").unlink(missing_ok=True)

print(f"Restored {len(files)} project files.")
