FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    g++ \
    gcc \
    openjdk-17-jdk \
    python3 \
    python3-pip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 sandbox && \
    mkdir -p /sandbox/temp && \
    chown -R sandbox:sandbox /sandbox

WORKDIR /sandbox

USER sandbox

RUN ulimit -v 262144 && \
    ulimit -t 10

COPY --chown=sandbox:sandbox . /sandbox

EXPOSE 3001

CMD ["node", "sandboxServer.js"]
