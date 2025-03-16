# Do-It Compliance Check

This GitHub action triggers the Do-It compliance check script for the specified directory.
The compliance check script is used to check if the filestructure matches the Do-It guidelines.

This returns a non-zero exit code if the compliance check fails.

## Inputs

- `source` - The directory to check (default: `.`)

## Example usage

```yaml
uses: do-it-ecm/compliance-check@1.0.0
with:
  source: 'src'
```
