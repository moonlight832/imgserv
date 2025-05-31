from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name='skyechat-vps-installer',
    version='1.0.0',
    author='SkyeChat Team',
    author_email='support@skyechat.com',
    description='Automated installer for deploying SkyeChat web application on VPS servers',
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/SkyeChatv2",
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    install_requires=requirements,
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: System Administrators",
        "License :: OSI Approved :: MIT License",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Topic :: System :: Installation/Setup",
        "Topic :: System :: Systems Administration",
    ],
    python_requires=">=3.8",
    entry_points={
        'console_scripts': [
            'skyechat-install=main:main',
        ],
    },
    keywords='vps installer deployment automation skyechat web-app nodejs react',
)