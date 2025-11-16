# Firebase App Hosting Gen2 Migration Fix

## Problem
You're encountering an error when deploying to Firebase App Hosting:
- Container Threat Detection is enabled, which requires gen2 execution environment
- The existing service is using gen1 execution environment  
- Firebase is blocking the deployment because modifying it would create a new revision

## Current Configuration
Your `apphosting.yaml` already has the correct configuration:
```yaml
runConfig:
  executionEnvironment: gen2
```

## Solution

The configuration is already correct. The error is occurring because Firebase App Hosting detects a mismatch between the existing gen1 service and your gen2 configuration. Here are the steps to resolve:

### Option 1: Force New Deployment (Recommended)

1. **Ensure your code is committed** to your repository (Firebase App Hosting deploys from git):
   ```bash
   git add comfyshare-app/apphosting.yaml
   git commit -m "Migrate to gen2 execution environment"
   git push
   ```

2. **Trigger a new rollout** through Firebase App Hosting:
   ```bash
   firebase apphosting:rollouts:create comfyshare-backend --git-branch main --force
   ```
   Or via the Firebase Console: Go to App Hosting → Select your backend → Create new rollout

3. Firebase App Hosting will create a **new revision** with gen2, which is expected and normal behavior.

### Option 2: Update via Firebase Console

1. Go to Firebase Console → App Hosting → Your backend (`comfyshare-backend`)
2. Click "Create rollout" or "Deploy new revision"
3. Select your branch/commit that has the gen2 configuration
4. Confirm the deployment - Firebase will create a new revision with gen2

### Option 3: Temporary Workaround (If above doesn't work)

If Firebase continues to block the migration, you may need to temporarily disable Container Threat Detection:

1. **Disable Container Threat Detection** (via Google Cloud Console):
   - Go to Security Command Center
   - Temporarily disable Container Threat Detection for the project
   
2. **Deploy with gen2** configuration (which is already in your `apphosting.yaml`)

3. **Re-enable Container Threat Detection** after successful deployment

## Verification

After deployment, verify the service is using gen2:
- Check the rollout status in Firebase Console
- The new revision should show gen2 execution environment
- Container Threat Detection should work with gen2

## Notes

- Creating a new revision when changing execution environment is **normal and expected behavior**
- Your `apphosting.yaml` configuration is already correct
- The issue is that Firebase App Hosting needs to be explicitly told to proceed with creating the new revision
- The `--force` flag or manual rollout creation should allow this to proceed

