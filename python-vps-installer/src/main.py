import sys
import os
from installer import WebAppInstaller

def main():
    """Main entry point for the VPS installer"""
    print("🚀 SkyeChat VPS Installer")
    print("=" * 50)
    
    try:
        installer = WebAppInstaller()
        installer.run_full_installation()
        
        print("\n" + "=" * 50)
        print("📋 Next Steps:")
        print("1. Update your DNS records to point to this server")
        print("2. Configure SSL certificate (recommended: Let's Encrypt)")
        print("3. Update the Convex environment variables in .env file")
        print("4. Check logs with: sudo journalctl -u skyechat -f")
        print("5. Restart service with: sudo systemctl restart skyechat")
        
    except KeyboardInterrupt:
        print("\n❌ Installation cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Installation failed: {e}")
        print("\nFor troubleshooting:")
        print("- Check system logs: sudo journalctl -xe")
        print("- Check nginx logs: sudo tail -f /var/log/nginx/error.log")
        print("- Check app logs: sudo journalctl -u skyechat -f")
        sys.exit(1)

if __name__ == "__main__":
    main()