# Qiyal AI - Frontend

This is the frontend application for Qiyal AI, built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vashsempai/qiyal-ai.git
cd qiyal-ai/frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **GraphQL Client:** Apollo Client
- **Package Manager:** npm

## 📁 Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── apolloClient.ts    # Apollo GraphQL client configuration
│   │   ├── mutations.ts       # GraphQL mutations
│   │   └── queries.ts         # GraphQL queries
│   └── ...
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🎯 Features

- Modern React with Next.js App Router
- TypeScript for type safety
- Responsive design with Tailwind CSS
- GraphQL integration with Apollo Client
- Optimized for performance and SEO

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📚 GraphQL Integration

The application uses Apollo Client for GraphQL integration. Key files:

- `src/lib/apolloClient.ts` - Apollo Client configuration
- `src/lib/queries.ts` - GraphQL queries
- `src/lib/mutations.ts` - GraphQL mutations

## 🎨 Styling

This project uses Tailwind CSS for styling. The configuration can be found in `tailwind.config.js`.

## 🚀 Deployment

The application can be deployed on platforms like Vercel, Netlify, or any Node.js hosting service.

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📧 Contact

For questions or support, please contact the development team.
