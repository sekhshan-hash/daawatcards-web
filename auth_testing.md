# Auth Testing Playbook

## Phone OTP (mocked)
POST /api/auth/otp/request {"phone":"9876543210"} -> {dev_code:"123456", mocked:true}
POST /api/auth/otp/verify {"phone":"9876543210","code":"123456"} -> sets httpOnly session_token cookie, returns user

## Google (Emergent Auth) - create test session manually
mongosh --eval "
use('test_database');
var userId = 'test-user-' + Date.now();
var sessionToken = 'test_session_' + Date.now();
db.users.insertOne({user_id: userId, auth_provider: 'google', email: 'test.user.' + Date.now() + '@example.com', name: 'Test User', picture: '', created_at: new Date().toISOString()});
db.user_sessions.insertOne({user_id: userId, session_token: sessionToken, expires_at: new Date(Date.now() + 7*24*60*60*1000), created_at: new Date()});
print('Session token: ' + sessionToken);
"
curl -H "Authorization: Bearer TOKEN" $API/api/auth/me

Browser: add cookie session_token (httpOnly, secure, sameSite None, path /) for the app domain, then open /dashboard.
