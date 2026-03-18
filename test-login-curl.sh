#!/bin/bash

echo "🧪 Testing Login API..."
echo ""

echo "📧 Testing Player Login:"
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"player@test.com","password":"player123"}'

echo ""
echo ""

echo "👑 Testing Admin Login:"
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'

echo ""
echo ""

echo "🏠 Testing Fields API:"
curl -X GET http://localhost:5000/api/fields

echo ""
echo "✅ Tests completed!"
