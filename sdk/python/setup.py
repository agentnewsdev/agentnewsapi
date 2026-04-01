from setuptools import setup, find_packages

setup(
    name="agentnews",
    version="1.2.0",
    author="Agent News Protocol",
    author_email="ops@agentnewsapi.com",
    description="Python SDK for the Agent News Protocol",
    long_description=open("README.md").read() if open("README.md") else "",
    long_description_content_type="text/markdown",
    url="https://github.com/agentnewsapi/agentnewsapi",
    packages=find_packages(),
    install_requires=[
        "requests>=2.31.0",
        "python-socketio[client]>=5.11.1",
        "websocket-client>=1.7.0",
        "base58>=2.1.0",
        "pynacl>=1.5.0",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: ISC License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
)
