FROM node:14.16.1-alpine AS development

ENV CI=true
ENV PORT=3000

WORKDIR /code
COPY package.json package-lock.json mithril-materialized-custom.tgz /code/
RUN npm ci
COPY index.html webpack.prod.js tsconfig.json .babelrc version.ejs /code/
COPY src /code/src

CMD [ "npm", "start" ]

FROM development AS builder

RUN npm run build

FROM nginx:1.21.6-alpine

COPY --from=builder /code/index.html /usr/share/nginx/html
COPY --from=builder /code/dist /usr/share/nginx/html/dist
