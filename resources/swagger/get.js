var app = require('../../package').app,
        swagger = {
            "swagger": "2.0",
            "info": {
                "version": app.version,
                "title": app.name,
                "description": app.description,
                "termsOfService": app.urls.termsOfService,
                "contact": {
                    "name": "Starter App",
                    "email": "support@starterapp.io",
                    "url": "http://starterapp.io"
                },
//                "license": {"name": "Restricted"}
            },
            "transport": "http://",
            "basePath": "/",
            "schemes": ["http", "https", "ws", "wss"],
            "consumes": ["application/json"],
            "produces": ["application/json"],
            "securityDefinitions": {
                "api_key": {
                    "type": "apiKey",
                    "name": "apiKey",
                    "in": "header"
                }
            },
            "paths": {
                "/auth/google": {
                    "get": {
                        "description": "Authenticate a user with Google",
                        "parameters": [
                            {
                                "description": "The url to redirect to after dealing with Google, whether successful or not.",
                                "in": "query",
                                "name": "redirectURL",
                                "required": true,
                                "type": "string"
                            }
                        ],
                        "responses": {},
                        "tags": ["Auth"]
                    }
                },
                "/auth/google/token": {
                    "get": {
                        "description": "Authenticate a user with Google's Token",
                        "parameters": [
                            {
                                "description": "The token received from Google",
                                "in": "header",
                                "name": "token",
                                "required": true,
                                "type": "string"
                            }
                        ],
                        "responses": {},
                        "tags": ["Auth"]
                    },
                    "post": {
                        "description": "Authenticate a user with Google's Token",
                        "parameters": [
                            {
                                "description": "The token received from Google",
                                "in": "body",
                                "name": "token",
                                "required": true,
                                "type": "string"
                            }
                        ],
                        "responses": {},
                        "tags": ["Auth"]
                    }
                },
                "/user/login": {
                    "post": {
                        "description": "Logs in a user",
                        "parameters": [
                            {
                                "description": "Object containing user credentials",
                                "in": "body",
                                "name": "payload",
                                "required": true,
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "email": {
                                            "id": "email",
                                            "name": "email",
                                            "order": 0,
                                            "required": true,
                                            "type": "string",
                                            "typeLabel": "string"
                                        },
                                        "password": {
                                            "id": "password",
                                            "name": "password",
                                            "order": 0,
                                            "required": true,
                                            "type": "string",
                                            "typeLabel": "string"
                                        }
                                    }
                                }
                            }
                        ],
                        "responses": {},
                        "tags": ["Auth"]
                    }
                },
                "/user/resend-verification-email": {
                    "post": {
                        "description": "Resends the verification email to the use",
                        "parameters": [
                            {
                                "description": "Object containing user's email",
                                "in": "body",
                                "name": "payload",
                                "required": true,
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "email": {
                                            "id": "email",
                                            "name": "email",
                                            "order": 0,
                                            "required": true,
                                            "type": "string",
                                            "typeLabel": "string"
                                        }
                                    }
                                }
                            }
                        ],
                        "responses": {},
                        "tags": ["Auth"]
                    }
                },
                "/user/reset-password": {
                    "post": {
                        "description": "Reset a user's password",
                        "parameters": [
                            {
                                "description": "Object containing user's new password and token allowing it",
                                "in": "body",
                                "name": "payload",
                                "required": true,
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "password": {
                                            "id": "password",
                                            "name": "password",
                                            "order": 0,
                                            "required": true,
                                            "type": "string",
                                            "typeLabel": "string"
                                        },
                                        "confirm": {
                                            "id": "confirm",
                                            "name": "confirm",
                                            "order": 0,
                                            "required": true,
                                            "type": "string",
                                            "typeLabel": "string"
                                        },
                                        "token": {
                                            "id": "token",
                                            "name": "token",
                                            "order": 0,
                                            "required": true,
                                            "type": "string",
                                            "typeLabel": "string"
                                        }
                                    }
                                }
                            }
                        ],
                        "responses": {},
                        "tags": ["Auth"]
                    }
                },
                "/user/send-password-reset-email": {
                    "post": {
                        "description": "Sends a password reset email to the user",
                        "parameters": [
                            {
                                "description": "Object containing user's email",
                                "in": "body",
                                "name": "payload",
                                "required": true,
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "email": {
                                            "id": "email",
                                            "name": "email",
                                            "order": 0,
                                            "required": true,
                                            "type": "string",
                                            "typeLabel": "string"
                                        }
                                    }
                                }
                            }
                        ],
                        "responses": {},
                        "tags": ["Auth"]
                    }
                }
            }
        },
        swagtool = require('dpd-swagger-doc');
swagtool.initResources(swagger, ctx.dpd);
ctx.done(false, swagger);
