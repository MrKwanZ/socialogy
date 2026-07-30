#!/usr/bin/env bash
# API smoke: health, signup, login, createPost, posts, upload.
# Usage: ./scripts/smoke-api.sh [API_ORIGIN]
# Requires: curl, node
set -euo pipefail

API="${1:-http://localhost:8080}"
API="${API%/}"
EMAIL="smoke-$(date +%s)@example.com"
PASSWORD="smoketest1"
NAME="Smoke Tester"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

json_get() {
  local json="$1"
  local expr="$2"
  JSON_DOC="$json" JSON_EXPR="$expr" node <<'NODE'
const d = JSON.parse(process.env.JSON_DOC);
const v = eval(process.env.JSON_EXPR);
if (v === undefined || v === null || v === false) process.exit(1);
process.stdout.write(String(v));
NODE
}

gql() {
  local query="$1"
  local vars_json="$2"
  local token="${3:-}"
  local body
  body=$(QUERY="$query" VARS="$vars_json" node <<'NODE'
process.stdout.write(JSON.stringify({
  query: process.env.QUERY,
  variables: JSON.parse(process.env.VARS || '{}'),
}));
NODE
)
  local -a args
  args=(-sS "$API/graphql" -H "Content-Type: application/json" -d "$body")
  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  curl "${args[@]}"
}

echo "== health =="
HEALTH=$(curl -sfS "$API/health")
json_get "$HEALTH" "d.status==='ok'" >/dev/null
echo "ok"

echo "== createUser =="
VARS=$(EMAIL="$EMAIL" NAME="$NAME" PASSWORD="$PASSWORD" node <<'NODE'
process.stdout.write(JSON.stringify({
  email: process.env.EMAIL,
  name: process.env.NAME,
  password: process.env.PASSWORD,
}));
NODE
)
CREATE=$(gql \
  'mutation($email:String!,$name:String!,$password:String!){ createUser(userInput:{email:$email,name:$name,password:$password}){ _id email } }' \
  "$VARS")
json_get "$CREATE" "d.data.createUser._id" >/dev/null
echo "ok"

echo "== login =="
VARS=$(EMAIL="$EMAIL" PASSWORD="$PASSWORD" node <<'NODE'
process.stdout.write(JSON.stringify({
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
}));
NODE
)
LOGIN=$(gql \
  'query($email:String!,$password:String!){ login(email:$email,password:$password){ token userId } }' \
  "$VARS")
TOKEN=$(json_get "$LOGIN" "d.data.login.token")
[[ -n "$TOKEN" && "$TOKEN" != "undefined" ]]
echo "ok"

echo "== upload =="
printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82' >"$TMP/pixel.png"
UPLOAD=$(curl -sfS -X PUT "$API/post-image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@$TMP/pixel.png;type=image/png")
FILE_PATH=$(json_get "$UPLOAD" "d.filePath")
[[ "$FILE_PATH" == images/* ]]
echo "ok ($FILE_PATH)"

echo "== createPost =="
VARS=$(FILE_PATH="$FILE_PATH" node <<'NODE'
process.stdout.write(JSON.stringify({
  title: 'Smoke Post Title',
  content: 'Smoke post content body',
  imageUrl: process.env.FILE_PATH,
}));
NODE
)
POST=$(gql \
  'mutation($title:String!,$content:String!,$imageUrl:String!){ createPost(postInput:{title:$title,content:$content,imageUrl:$imageUrl}){ _id title imageUrl } }' \
  "$VARS" \
  "$TOKEN")
POST_ID=$(json_get "$POST" "d.data.createPost._id")
[[ -n "$POST_ID" && "$POST_ID" != "undefined" ]]
echo "ok ($POST_ID)"

echo "== posts =="
FEED=$(gql \
  'query{ posts(page:1){ totalPosts posts{ _id title } } }' \
  '{}' \
  "$TOKEN")
json_get "$FEED" "d.data.posts.totalPosts>=1" >/dev/null
echo "ok"

echo "== static image =="
CODE=$(curl -sfS -o /dev/null -w "%{http_code}" "$API/$FILE_PATH")
[[ "$CODE" == "200" ]]
echo "ok"

echo
echo "Smoke passed against $API"
