FROM arm64/node:18-slim
ENV WORKINGDIR /app
WORKDIR ${WORKINGDIR}

ADD package.json ${WORKINGDIR}/package.json
ADD .eslintrc.json ${WORKINGDIR}/.eslintrc.json
ADD tsconfig.json ${WORKINGDIR}/tsconfig.json
ADD src ${WORKINGDIR}/src

RUN npm install -q && \
    npm run build && \
    npm run eslint && \
    npm prune --production && \
    rm -f .eslintrc.json && \
    rm -f tsconfig.json && \
    rm -rf src

EXPOSE 9092

ENTRYPOINT ["node", "./dist/index"]
