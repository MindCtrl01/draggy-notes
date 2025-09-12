# 📝 Draggy Notes

A beautiful, interactive drag-and-drop note-taking application built with React and TypeScript. Create, organize, and manage your notes with an intuitive interface that lets you drag notes around the canvas.

## ✨ Features

- **🎯 Drag & Drop Interface**: Smoothly drag notes around the canvas to organize them visually
- **📝 Inline Editing**: Click any note to edit its content directly
- **🎨 Beautiful UI**: Modern design with shadcn/ui components and Tailwind CSS
- **⚡ Fast Performance**: Built with Vite for lightning-fast development and builds
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🔄 Real-time Updates**: Instant visual feedback with optimized drag performance

## 🚀 Live Demo

Visit the live application: **[https://mindctrl01.github.io/draggy-notes/](https://mindctrl01.github.io/draggy-notes/)**

## 🛠️ Tech Stack

- **Frontend Framework**: [React 18](https://reactjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM](https://reactrouter.com/)

## 📦 Installation & Setup

### Prerequisites

- **Node.js** (version 18 or higher)
- **npm** or **yarn**

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/MindCtrl01/draggy-notes.git
   cd draggy-notes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:7000
   ```

## 🔧 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Deploy to GitHub Pages |

## 🎮 How to Use

1. **Creating Notes**: The application starts with sample notes on the canvas
2. **Moving Notes**: Click and drag any note to reposition it anywhere on the canvas
3. **Editing Notes**: Click on a note's content to edit it inline
4. **Deleting Notes**: Hover over a note and click the trash icon to delete it
5. **Keyboard Shortcuts**:
   - `Enter`: Save changes when editing
   - `Shift + Enter`: Add line break while editing
   - `Escape`: Cancel editing

## 🏗️ Project Structure

```
draggy-notes/
├── public/
│   ├── 404.html          # GitHub Pages fallback
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   ├── NoteCard.tsx  # Individual note component
│   │   └── NotesCanvas.tsx # Main canvas component
│   ├── pages/
│   │   ├── Index.tsx     # Home page
│   │   └── NotFound.tsx  # 404 page
│   ├── types/
│   │   └── note.ts       # TypeScript interfaces
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions deployment
└── package.json
```

## 🚀 Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions.

### Automatic Deployment
- Every push to the `main` branch triggers a deployment
- The workflow builds the project and deploys to the `gh-pages` branch
- Live site: [https://mindctrl01.github.io/draggy-notes/](https://mindctrl01.github.io/draggy-notes/)

### Manual Deployment
```bash
npm run build
npm run deploy
```

## 🎨 Customization

### Adding New Note Colors
Edit the CSS variables in `src/index.css` to add new note colors:

```css
:root {
  --note-new-color: hsl(200 100% 90%);
  --note-new-color-foreground: hsl(200 100% 10%);
}
```

### Modifying Drag Behavior
The drag functionality is implemented in `src/components/NoteCard.tsx` with:
- Smooth animations using `requestAnimationFrame`
- Optimized event handlers with passive listeners
- Disabled transitions during dragging for responsiveness

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- Icons provided by [Lucide](https://lucide.dev/)
- Deployed using [GitHub Pages](https://pages.github.com/)

---

**Made with ❤️ by [MindCtrl01](https://github.com/MindCtrl01)**