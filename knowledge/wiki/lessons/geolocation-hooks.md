---
title: Geolocation & Location Beacon
description: Lazy permission request, numeric error codes, defensive API handling
categories: [geolocation, browser-api, ux]
sources: [log_2026-02-06_issue_86_user_location_beacon.md]
---

# Geolocation & Location Beacon

## Lazy Permission Pattern

Never request location on page load:

```typescript
// Only request on user action
const onFindMe = async () => {
  const status = await navigator.permissions.query({ name: 'geolocation' });
  if (status.state === 'prompt') {
    navigator.geolocation.getCurrentPosition(success, error);
  }
};
```

## Error Code Handling

Use numeric codes, not undefined constants:

```typescript
const getCurrentPosition = (onSuccess, onError) => {
  navigator.geolocation.getCurrentPosition(
    onSuccess,
    (error) => {
      // Use numeric codes for browser compatibility
      if (error.code === 1) {
        // PERMISSION_DENIED
        showToast('Location access denied');
      } else if (error.code === 2) {
        // POSITION_UNAVAILABLE
        showToast('Location unavailable');
      } else if (error.code === 3) {
        // TIMEOUT
        showToast('Location timeout');
      }
    }
  );
};
```

## Defensive Hook

Handle "unknown" states for Firefox:

```typescript
const useGeolocation = () => {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  
  // Default to "unknown" for Firefox compatibility
  const [permissionStatus, setPermissionStatus] = useState<'unknown'>('unknown');
  
  return { position, error, permissionStatus };
};
```

---

## Related

- [mobile-ui](../patterns/mobile-ui.md)