# 🔐 Firebase Custom Claims Setup Guide

## 问题: Hardcoded Admin UID is a Security Risk ❌

**Old approach** (không an toàn):
```javascript
function isAdmin() {
  return request.auth != null && request.auth.uid == 'FEpPWWT1EaTWQ9FOqBxWN5FeEJk1';
}
```

**Problems**:
- ❌ Admin UID visible trong rules (repo, Firebase Console)
- ❌ Khó thay đổi (phải deploy rules mới)
- ❌ Không scalable (chỉ 1 admin)
- ❌ Nếu leak → attacker biết chính xác target

---

## ✅ **New Approach: Custom Claims** (BEST PRACTICE)

**Rules sekarang check 2 ways**:
```javascript
function isAdmin() {
  return request.auth != null && (
    // Primary: Custom claim (Firebase best practice)
    request.auth.token.admin == true
    ||
    // Fallback: Admins collection (dynamic, no redeploy needed)
    exists(/databases/$(database)/documents/admins/$(request.auth.uid))
  );
}
```

**Benefits**:
- ✅ Admin UID không exposed
- ✅ Flexible: update admin list without redeploying rules
- ✅ Scalable: multiple admins
- ✅ Secure: claims signed by Firebase, không thể fake

---

## 🚀 **Setup Custom Claims (3 cách)**

### **Option 1: Firebase Console (Easiest) - 5 phút**

1. **Mở Firebase Console**:
   - https://console.firebase.google.com/project/xemgiadat-dfe15/authentication/users

2. **Tìm user "Được Huỳnh Văn"** (hoặc your admin user)
   - Click vào user

3. **Scroll down → "Custom Claims"**
   - Click **Edit**
   - Paste:
   ```json
   {
     "admin": true
   }
   ```
   - Click **Save**

4. **Done!** ✅
   - User giờ có admin access
   - Không cần deploy rules mới (rules đã check claim)

---

### **Option 2: Firebase Admin SDK (Node.js)**

**Dùng nếu bạn có server/backend**:

```javascript
const admin = require('firebase-admin');

async function setAdminClaim(uid) {
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`✅ Set admin claim for ${uid}`);
}

// Gọi function
// setAdminClaim('FEpPWWT1EaTWQ9FOqBxWN5FeEJk1');
```

**Cách chạy**:
```bash
# Khởi tạo Firebase Admin project
npm install firebase-admin

# Config:
const serviceAccountKey = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey),
  projectId: 'xemgiadat-dfe15'
});

# Chạy script
node setAdminClaim.js
```

---

### **Option 3: Firebase CLI + Node.js (Recommended)**

**Setup one-time**:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Create script file: setAdmin.js
cat > setAdmin.js << 'EOF'
const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'xemgiadat-dfe15'
});

async function main() {
  const uid = 'FEpPWWT1EaTWQ9FOqBxWN5FeEJk1'; // Your UID
  await admin.auth().setCustomUserClaims(uid, { admin: true });
  console.log(`✅ Admin claim set for ${uid}`);
  process.exit(0);
}

main().catch(console.error);
EOF

# Run
firebase functions:shell
// Inside shell:
// require('firebase-admin').initializeApp()
// admin.auth().setCustomUserClaims('FEpPWWT1EaTWQ9FOqBxWN5FeEJk1', {admin: true})
```

---

## 📋 **Fallback: Admins Collection** (Optional, for offline management)

Nếu không setup custom claims, có thể dùng collection:

### **Step 1**: Create collection `admins`

Go to Firebase Console → Firestore → Create collection:
- **Collection ID**: `admins`
- **First document ID**: `FEpPWWT1EaTWQ9FOqBxWN5FeEJk1`
- **Fields**:
  ```
  isAdmin: true (boolean)
  ```

### **Step 2**: Rules sẽ auto-check

```javascript
exists(/databases/$(database)/documents/admins/$(request.auth.uid))
```

**Benefits of fallback**:
- ✅ No custom claims setup needed
- ✅ Can update admin list in Firebase Console
- ✅ No redeployment needed

---

## ✅ **Verification: Is Admin Claim Set?**

### **Method 1: Console Log**
```javascript
// In your app code
firebase.auth().currentUser.getIdTokenResult().then(idTokenResult => {
  console.log('Custom claims:', idTokenResult.claims);
  console.log('Is admin?', idTokenResult.claims.admin === true);
});
```

### **Method 2: Firebase Console**
- Authentication → Users → Click your user
- Scroll to "Custom Claims"
- Should see: `{ "admin": true }`

### **Method 3: Test Rules**
- Try admin operation (e.g., delete other user's listing)
- If works → claim is set ✅
- If fails → claim not set yet ❌

---

## 🔄 **Migrating from Hardcoded to Custom Claims**

**For existing setup**:

1. **Rules updated** ✅ (already merged in latest version)
   - File: [`firestore.rules`](firestore.rules)
   - Supports both custom claims + fallback collection

2. **Option A: Set custom claim** (Recommended)
   - Use Firebase Console (5 min)
   - Or use Admin SDK

3. **Option B: Create admins collection** (Fallback)
   - If you don't want to mess with custom claims yet
   - Still more secure than hardcoded

4. **Both work!**
   - Rules check both methods
   - No breaking changes

---

## 📊 **Security Comparison**

| Approach | Security | Flexibility | Setup Time |
|----------|----------|-------------|------------|
| **Hardcoded UID** (old) | ❌ Low | ❌ None | -  |
| **Custom Claims** (new) | ✅ High | ✅ High | 5 min |
| **Admins Collection** (fallback) | ✅ High | ✅ Medium | 3 min |
| **Both** (hybrid) | ✅✅ Highest | ✅✅ Highest | 8 min |

---

## 🚨 **NEXT STEPS**

1. **Deploy updated Firestore rules** from [`firestore.rules`](firestore.rules)
2. **Set custom claim** using Firebase Console (Option 1 - easiest)
   - Or create admins collection (Option 3 - fallback)
3. **Test form submission** → should work now
4. **Verify admin permissions** work (test delete other user's listing)

---

## 🎯 **TIMELINE**

- **Immediate**: Deploy rules (no code change needed)
- **Next 5 min**: Set custom claim via Console
- **Result**: App works + secure admin management ✅

---

## 📞 **Troubleshooting**

### **Issue: Form still fails with permission-denied**
- ✅ Rules deployed?
- ✅ Custom claim set?
- ✅ User logged in?
- Check console for errors

### **Issue: Admin operations still fail**
- Check: Does user have custom claim `admin: true`?
- Or: Is user ID in admins collection?
- Verify: User logged back in (claim cached in token)?

### **Issue: Can't find Custom Claims in Console**
- Scroll down in user detail page
- Or check: Is user authenticated?

---

## 📚 **References**

- Firebase Custom Claims Docs: https://firebase.google.com/docs/auth/admin-setup-custom-claims
- Firestore Rules Reference: https://firebase.google.com/docs/firestore/security/rules-reference
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup

---

**Bạn làm từng bước, mình support!** 🚀
