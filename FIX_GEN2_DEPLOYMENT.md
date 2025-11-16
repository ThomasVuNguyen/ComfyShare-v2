# Fix: Firebase App Hosting Gen2 Execution Environment Migration

## Problem
Firebase App Hosting is blocking deployments because:
- Container Threat Detection is enabled (requires gen2)
- Existing service is gen1
- Firebase blocks the migration even though `apphosting.yaml` specifies gen2

## Root Cause
Firebase App Hosting validates the execution environment before building and blocks if it would require creating a new revision when Container Threat Detection is enabled.

## Solution

Your `apphosting.yaml` is **already correctly configured** with `executionEnvironment: gen2`. The issue is Firebase's validation check.

### Step 1: Temporarily Disable Container Threat Detection

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Security Command Center** → **Settings** → **Container Threat Detection**
3. Temporarily disable Container Threat Detection for project `starmind-72daa`

OR via gcloud (if you have the right permissions):
```bash
# Note: This requires specific IAM permissions
gcloud scc settings update --organization=ORGANIZATION_ID --name=containerThreatDetectionSettings
```

### Step 2: Deploy with Gen2 Configuration

Your `apphosting.yaml` already has gen2 configured, so simply create a new rollout:

```bash
firebase apphosting:rollouts:create comfyshare-backend --git-branch main --force --project=starmind-72daa
```

This will:
- Deploy using gen2 execution environment (from your apphosting.yaml)
- Create a new Cloud Run revision with gen2
- Complete successfully since Container Threat Detection is temporarily disabled

### Step 3: Re-enable Container Threat Detection

After successful deployment:

1. Go back to Security Command Center
2. Re-enable Container Threat Detection
3. Verify it's working with gen2 (it should, since the service is now gen2)

### Alternative: Contact Firebase Support

If you cannot disable Container Threat Detection (due to organizational policies), you may need to:
1. Contact Firebase support to manually migrate the service
2. Or request a temporary exception to allow the migration

## Verification

After deployment, verify gen2 is active:
```bash
firebase apphosting:backends:get comfyshare-backend --project=starmind-72daa
```

Check the rollout status in Firebase Console to confirm gen2 execution environment.

## Current Configuration Status

✅ `apphosting.yaml` already has `executionEnvironment: gen2`  
✅ Configuration is correct and ready to deploy  
⚠️ Firebase validation is blocking due to Container Threat Detection check

