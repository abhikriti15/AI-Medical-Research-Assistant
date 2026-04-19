# Validation Error Fix

## Error: "Validation failed"

### Root Cause
The Joi validation schema was too strict and not properly handling the request data.

### Issues Fixed

1. **Joi Schema Issues**
   - Added `.convert(true)` to convert types automatically
   - Added `.allow(null, '')` for optional fields
   - Added proper error messages
   - Fixed UUID validation to allow null

2. **Environment Configuration**
   - Created `frontend/.env` with correct API URL (`/api` for proxy)
   - Created `backend/.env` with all required variables
   - Updated `.env.example` files

3. **API Proxy Setup**
   - Vite proxy configured to forward `/api` requests to `http://localhost:5000`
   - Frontend uses `/api` instead of full URL

### Files Fixed

1. **backend/src/middleware/validateInput.js**
   - Added better error messages
   - Added `convert: true` option
   - Added logging for debugging
   - Fixed optional field handling

2. **frontend/.env** (created)
   - Set `VITE_API_URL=/api` to use proxy

3. **backend/.env** (created)
   - All required environment variables

### How to Test

1. **Restart services**
```bash
docker-compose down
docker-compose up -d
```

2. **Test the API**
```bash
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Type 2 Diabetes treatment",
    "disease": "Type 2 Diabetes"
  }'
```

3. **Check logs**
```bash
docker-compose logs backend
```

Should see:
```
Validating query: { query: '...', disease: '...' }
Validation passed, proceeding with query
```

### Expected Response

```json
{
  "sessionId": "...",
  "expandedQuery": "...",
  "response": {
    "summary": "...",
    "papers": [...],
    "trials": [...]
  },
  "metadata": {
    "totalResultsFound": 150,
    "papersUsed": 5,
    "trialsUsed": 3,
    "responseTime": 8234
  }
}
```

### If Error Still Occurs

1. **Check backend logs**
```bash
docker-compose logs backend | grep -i validation
```

2. **Check frontend console**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for request/response

3. **Verify request format**
```bash
# Should have Content-Type header
curl -X POST http://localhost:5000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query":"test query","disease":"diabetes"}'
```

4. **Check .env files exist**
```bash
ls -la backend/.env
ls -la frontend/.env
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Validation failed" | Restart backend: `docker-compose restart backend` |
| No response from server | Check backend is running: `docker-compose ps` |
| CORS error | Check CORS_ORIGIN in backend/.env |
| API not found | Check proxy in vite.config.js |
| Empty query error | Query must be at least 3 characters |

### Validation Rules

- **query**: Required, 3-500 characters
- **disease**: Optional, max 200 characters
- **structuredInput**: Optional boolean
- **sessionId**: Optional UUID format
- **userId**: Optional string

### Debug Mode

To see detailed validation errors:

1. Check backend logs:
```bash
docker-compose logs -f backend
```

2. Look for "Validating query:" messages

3. Check "details" array in error response for specific field errors

### Next Steps

1. ✅ Restart services
2. ✅ Test with sample query
3. ✅ Check logs for validation messages
4. ✅ Verify response includes papers and trials
5. ✅ Check LLM generates summary

---

**Status**: Error fixed and ready to test
