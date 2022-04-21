FROM node:16 AS build-env
COPY . /app
WORKDIR /app
RUN npm run build

FROM gcr.io/distroless/nodejs:16
LABEL org.opencontainers.image.source="https://github.com/oss-tooling/github-reporting:0.0.1"
COPY --from=build-env /app/dist /app/dist
WORKDIR /app/dist
CMD ["node", "index.js"]
