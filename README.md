# Castro Home Builders serverless functions

This repository is a POC for automating project updates, sending transactional emails based on incoming webhook events from Monday. It contains serverless functions hosted on AWS Lambda, built with Node and Typescript.

Currently, the functions include:

- listening for Monday.com webhook events

The integrations are part of the modernization of the tech stack for Castro Home Builders.

> ⚠️ Under construction
>
> Currently, the only type of transactional emails this repository sends are project updates, however types have been added to help support future development.

## Structure

```
├── README.md
├── functions
│   └── webhook-listener.ts
├── handler.ts
├── lib
│   ├── monday.ts
│   └── types.d.ts
├── package-lock.json
├── package.json
├── serverless.yml
└── tests
    └── webhook-listener
        ├── challenge-request.json
        ├── item-update.json
        ├── status-change.json
        └── subitem-update.json
```

There's nothing really special about the `handler.ts` file, it's a requirement of AWS Lambda functions, and should register all of the available functionality the lambda has.

The `lib` folder contains type definitions and any shared modules/functionality between functions.

> ℹ️ Something to note:
>
> This repository also defines the necessary input event types under namespace `MondayWebhookEvents`. It defines the basic general structure of webhook event payloads that will be received in the function. This is something that is not provided by Monday natively and is subject to change at any time.

Tests in the `tests` directory should contain directories that match the name of the function they're testing.

## Setup

Run this command to initialize a new project in a new working directory.

```
npm install
```

## Usage

**Deploy**

```
npm serverless deploy
```

**Invoke the function locally.**

```
npm serverless invoke local --function hello --path ./tests/hello/event.json
```

Alternatively you can use the `local:invoke` script:

```
npm run local:invoke -- --function hello --path ./tests/hello/event.json
```

**Invoke the function over-the-wire**

```
curl https://xxxxxxxxx.execute-api.us-east-1.amazonaws.com/
```
