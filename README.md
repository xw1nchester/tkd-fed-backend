# Taekwondo Federation Platform

Copy example environment variables to .env file and update with your own values:
```bash
cp .env.example .env
```

Install project dependencies:
```bash
npm install
```

Apply database migrations:
```bash
npx prisma migrate deploy
```

Start the development server:
```bash
npm run start:dev
```

Access Swagger API documentation:
```bash
http://localhost:8080/api-docs
```