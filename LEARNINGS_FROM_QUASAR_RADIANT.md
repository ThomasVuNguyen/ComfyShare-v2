# Learnings from Quasar-Radiant (Working Firebase App Hosting Project)

## Key Findings

### 1. **File Location**
- ✅ **Quasar-Radiant**: `apphosting.yaml` is located in the **app directory** (`quasar-radiant-site/apphosting.yaml`)
- ⚠️ **ComfyShare-v2**: `apphosting.yaml` is in the **repository root** (`ComfyShare-v2/apphosting.yaml`)

**Recommendation**: Move `apphosting.yaml` to `comfyshare-app/apphosting.yaml` to match the working project structure.

### 2. **Configuration Simplicity**
- ✅ **Quasar-Radiant**: Minimal configuration - only specifies `minInstances` and `maxInstances`
  ```yaml
  runConfig:
    minInstances: 0
    maxInstances: 8
  ```

- ⚠️ **ComfyShare-v2**: More detailed configuration including explicit `executionEnvironment: gen2`
  ```yaml
  runConfig:
    minInstances: 1
    maxInstances: 50
    concurrency: 80
    cpu: 1
    memoryMiB: 1024
    executionEnvironment: gen2
  ```

### 3. **Critical Discovery: No `executionEnvironment` Specified**
- **Quasar-Radiant does NOT specify `executionEnvironment`** in its `apphosting.yaml`
- This means:
  - Firebase App Hosting uses **gen2 as the default** for new services
  - Or the service was created with gen2 from the start
  - **No migration from gen1 to gen2 was needed**

### 4. **The Root Cause of Your Issue**
Your ComfyShare-v2 service was created with **gen1** execution environment. When you try to explicitly set `executionEnvironment: gen2`, Firebase detects this as a migration and blocks it because:
- Container Threat Detection is enabled (requires gen2)
- The existing service is gen1
- Firebase blocks migrations when Container Threat Detection is enabled

## Recommended Solutions

### Option 1: Remove `executionEnvironment` (If Service Supports Default Gen2)
If your service can use gen2 by default (like Quasar-Radiant), try removing the explicit `executionEnvironment` line:

```yaml
runConfig:
  minInstances: 1
  maxInstances: 50
  concurrency: 80
  cpu: 1
  memoryMiB: 1024
  # Remove: executionEnvironment: gen2
```

**However**, this might not work if your service is already gen1 - Firebase might still use gen1.

### Option 2: Move `apphosting.yaml` to App Directory
Move the file to match Quasar-Radiant's structure:
```bash
mv ComfyShare-v2/apphosting.yaml ComfyShare-v2/comfyshare-app/apphosting.yaml
```

### Option 3: Simplify Configuration (Like Quasar-Radiant)
Try a minimal configuration first:
```yaml
runConfig:
  minInstances: 0
  maxInstances: 8
```

Then gradually add back other settings if needed.

### Option 4: Temporary Workaround (From Previous Analysis)
1. Temporarily disable Container Threat Detection
2. Deploy with gen2 configuration
3. Re-enable Container Threat Detection

## Next Steps

1. **Try moving `apphosting.yaml` to `comfyshare-app/` directory**
2. **Try removing `executionEnvironment: gen2`** and let Firebase use defaults
3. **If that doesn't work**, use the Container Threat Detection workaround

## Project Structure Comparison

**Quasar-Radiant** (Working):
```
quasar-radiant-site/
  ├── apphosting.yaml  ← In app directory
  ├── package.json
  ├── next.config.js
  └── ...
```

**ComfyShare-v2** (Current):
```
ComfyShare-v2/
  ├── apphosting.yaml  ← In root
  ├── comfyshare-app/
  │   ├── package.json
  │   └── ...
  └── ...
```

**ComfyShare-v2** (Recommended):
```
ComfyShare-v2/
  ├── comfyshare-app/
  │   ├── apphosting.yaml  ← Move here
  │   ├── package.json
  │   └── ...
  └── ...
```

