FROM node:18 as base

COPY package.json yarn.lock tsconfig.json tsconfig.build.json ./
COPY packages/model/package.json packages/model/package.json
COPY packages/client/package.json packages/client/package.json

COPY packages/model/src ./packages/model/src
COPY packages/client/src ./packages/client/src

COPY packages/model/tsconfig.json packages/model/tsconfig.json
COPY packages/model/tsconfig.build.json packages/model/tsconfig.build.json
COPY packages/client/tsconfig.json packages/client/tsconfig.json
COPY packages/client/tsconfig.build.json packages/client/tsconfig.build.json

RUN yarn install
RUN yarn build

FROM base as final

# AFJ specifc setup
WORKDIR /www
ENV RUN_MODE="docker"

COPY examples/chatbot/package.json examples/chatbot/package.json
COPY examples/chatbot/yarn.lock examples/chatbot/yarn.lock

# Run install after copying only depdendency file
# to make use of docker layer caching
COPY --from=base packages/model/build /www/packages/model/build
COPY --from=base packages/client/build /www/packages/client/build
RUN yarn --cwd examples/chatbot install


# Copy other depdencies
COPY examples/chatbot/index.ts examples/chatbot/index.ts
COPY examples/chatbot/data.ts examples/chatbot/data.ts
COPY examples/chatbot/phone-cred-def-dev.json examples/chatbot/phone-cred-def-dev.json
COPY examples/chatbot/tsconfig.json examples/chatbot/tsconfig.json

RUN yarn --cwd examples/chatbot build
COPY examples/chatbot/public examples/chatbot/build/public
CMD yarn --cwd examples/chatbot start
