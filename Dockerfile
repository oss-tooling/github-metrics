FROM node:16 AS build-env
COPY . /app
WORKDIR /app
RUN npm run build

FROM build-env
COPY --from=build-env /app/dist /app/dist
WORKDIR /app/dist
CMD ["node", "index.js"]
