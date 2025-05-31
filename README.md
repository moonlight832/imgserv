# SkyeChat

A modern Slack-like web application built with [Vite](https://vitejs.dev/) and [Convex](https://convex.dev) backend. Features real-time messaging, authentication, and a beautiful responsive UI.

## 🚀 Deployment Options

Choose your preferred deployment method:

| Method | Best For | Setup Time | Complexity |
|--------|----------|------------|------------|
| [🐳 Docker](#-docker-deployment) | Production, VPS | 5 minutes | Easy |
| [🔧 VPS Installer](#-vps-installer) | Traditional deployment | 10 minutes | Easy |
| [💻 Manual Setup](#-manual-development-setup) | Development, customization | 15 minutes | Medium |

---

## 🐳 Docker Deployment

**Recommended for production deployments**

### One-Command VPS Deployment

Deploy everything on a fresh VPS with Docker:

```bash
curl -fsSL https://raw.githubusercontent.com/moonlight832/imgserv/main/python-vps-installer/install-docker.sh | sudo bash
```

### Manual Docker Setup

1. **Install Docker:**
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

2. **Clone and configure:**
   ```bash
   git clone https://github.com/moonlight832/imgserv.git
   cd imgserv
   cp .env.example .env
   # Edit .env with your Convex configuration
   ```

3. **Deploy:**
   ```bash
   ./deploy.sh deploy
   ```

Your app will be available at `http://your-server-ip` (port 80) or `https://your-domain` (port 443).

**📖 For detailed Docker documentation:** [DOCKER.md](./DOCKER.md)

---

## 🔧 VPS Installer

**Perfect for traditional VPS deployments without Docker**

### Automated Installation

```bash
# Download and run the installer
curl -fsSL https://raw.githubusercontent.com/moonlight832/imgserv/main/python-vps-installer/install.sh | sudo bash
```

### Manual Installation Steps

1. **Download installer:**
   ```bash
   wget https://raw.githubusercontent.com/moonlight832/imgserv/main/python-vps-installer/install.sh
   chmod +x install.sh
   ```

2. **Configure (optional):**
   Edit the script to update:
   - Repository URL
   - Convex deployment URL
   - Convex auth secret
   - Domain name

3. **Run installer:**
   ```bash
   sudo ./install.sh
   ```

**What it installs:**
- Node.js 22.x (via NodeSource repository)
- Nginx reverse proxy
- Systemd service for the app
- Firewall configuration (UFW)
- SSL certificate setup (if domain provided)

**📖 For detailed installer documentation:** [python-vps-installer/README.md](./python-vps-installer/README.md)

---

## 💻 Manual Development Setup

**Best for local development and testing**

### Prerequisites

- Node.js 18+ (recommended: 22.x)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/moonlight832/imgserv.git
   cd imgserv
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Convex:**
   ```bash
   npx convex dev
   # Follow the prompts to create/connect your Convex deployment
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:5173` to see your app running.

### Available Scripts

- `npm run dev` - Start frontend and backend in development mode
- `npm run build` - Build for production
- `npm run start` - Start production server (after build)
- `npm run lint` - Run linting and type checking

---

## 🏗️ Project Structure

```
├── src/                    # Frontend React components
├── convex/                # Backend Convex functions
├── python-vps-installer/  # VPS deployment scripts
├── Dockerfile             # Docker container configuration
├── docker-compose.yml     # Docker orchestration
├── nginx.conf            # Nginx configuration
├── deploy.sh             # Docker deployment script
└── package.json          # Node.js dependencies
```

### Key Directories

- **`src/`** - Frontend built with React + Vite + TypeScript
- **`convex/`** - Backend serverless functions and database schema
- **`python-vps-installer/`** - Automated deployment scripts for VPS

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Convex Configuration
CONVEX_DEPLOYMENT=your-deployment-url
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# Authentication (optional)
CONVEX_AUTH_SECRET=your-auth-secret

# Domain (for SSL, optional)
DOMAIN=your-domain.com
```

### Convex Setup

This project uses [Convex](https://convex.dev) for the backend:

1. Sign up at [convex.dev](https://convex.dev)
2. Create a new deployment
3. Get your deployment URL and auth secret
4. Update your `.env` file

**Connected to deployment:** [`aware-caiman-68`](https://dashboard.convex.dev/d/aware-caiman-68)

---

## 🔐 Authentication

The app uses [Convex Auth](https://auth.convex.dev/) with Anonymous authentication for easy sign-in. You may want to configure additional providers before production deployment.

**Supported providers:**
- Anonymous (enabled by default)
- GitHub, Google, Discord (configurable)

---

## 🌐 Production Considerations

### SSL/HTTPS

- **Docker deployment:** Handles SSL automatically with Let's Encrypt
- **VPS installer:** Configures SSL if domain is provided
- **Manual setup:** You'll need to configure SSL separately

### Performance

- Built with Vite for optimal bundling
- Uses React 19 with modern features
- Convex provides real-time updates and optimized queries

### Security

- Firewall configuration included in automated installers
- Non-root user creation in Docker
- Environment variable isolation

---

## 📚 Documentation

- **[Docker Setup](./DOCKER.md)** - Complete Docker deployment guide
- **[VPS Installer](./python-vps-installer/README.md)** - Traditional deployment guide
- **[Convex Docs](https://docs.convex.dev/)** - Backend development
- **[Vite Docs](https://vitejs.dev/)** - Frontend build system

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🆘 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Check what's using the port
sudo lsof -i :3000
# Kill the process
sudo kill -9 <PID>
```

**Node.js version issues:**
```bash
# Install/use Node.js 22.x
nvm install 22
nvm use 22
```

**Convex connection issues:**
- Verify your `.env` file has correct `CONVEX_DEPLOYMENT` URL
- Check if Convex deployment is active
- Run `npx convex dev` to reconnect

### Getting Help

- 📖 Check the documentation links above
- 🐛 Open an issue on GitHub
- 💬 Ask in the Convex Discord community

---

## 🚀 Quick Start Summary

| What you want | Command |
|---------------|---------|
| **Production on VPS with Docker** | `curl -fsSL https://raw.githubusercontent.com/moonlight832/imgserv/main/python-vps-installer/install-docker.sh \| sudo bash` |
| **Production on VPS without Docker** | `curl -fsSL https://raw.githubusercontent.com/moonlight832/imgserv/main/python-vps-installer/install.sh \| sudo bash` |
| **Local development** | `git clone https://github.com/moonlight832/imgserv.git && cd imgserv && npm install && npm run dev` |
