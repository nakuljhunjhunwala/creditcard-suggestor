/* eslint-disable @typescript-eslint/naming-convention */
import swaggerJSDoc from 'swagger-jsdoc';
import { Application } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from './env.config';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'UniSchool Backend API',
      version: '1.0.0',
      description: 'School Management System API with Firebase Authentication',
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
      },
      schemas: {
        FirebaseLoginDto: {
          type: 'object',
          required: ['firebaseToken'],
          properties: {
            firebaseToken: {
              type: 'string',
              description: 'Firebase ID token from client-side authentication',
            },
          },
        },
        StaffUserCreationDto: {
          type: 'object',
          required: [
            'email',
            'first_name',
            'last_name',
            'user_type_id',
            'school_id',
          ],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Staff email address',
            },
            first_name: {
              type: 'string',
              description: 'Staff first name',
            },
            last_name: {
              type: 'string',
              description: 'Staff last name',
            },
            middle_name: {
              type: 'string',
              nullable: true,
              description: 'Staff middle name',
            },
            title: {
              type: 'string',
              nullable: true,
              description: 'Staff title/position',
            },
            user_type_id: {
              type: 'string',
              description: 'User type ID from user_types table',
            },
            school_id: {
              type: 'string',
              description: 'School ID',
            },
            department: {
              type: 'string',
              nullable: true,
              description: 'Staff department',
            },
            staff_number: {
              type: 'string',
              nullable: true,
              description: 'Staff employee number',
            },
            password: {
              type: 'string',
              format: 'password',
              nullable: true,
              description: 'Optional password for Firebase user creation',
            },
          },
        },
        GuardianUserCreationDto: {
          type: 'object',
          required: [
            'email',
            'first_name',
            'last_name',
            'user_type_id',
            'school_id',
          ],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Guardian email address',
            },
            first_name: {
              type: 'string',
              description: 'Guardian first name',
            },
            last_name: {
              type: 'string',
              description: 'Guardian last name',
            },
            middle_name: {
              type: 'string',
              nullable: true,
              description: 'Guardian middle name',
            },
            user_type_id: {
              type: 'string',
              description: 'User type ID from user_types table',
            },
            school_id: {
              type: 'string',
              description: 'School ID',
            },
            home_phone: {
              type: 'string',
              nullable: true,
              description: 'Guardian home phone',
            },
            work_phone: {
              type: 'string',
              nullable: true,
              description: 'Guardian work phone',
            },
            mobile_phone: {
              type: 'string',
              nullable: true,
              description: 'Guardian mobile phone',
            },
            password: {
              type: 'string',
              format: 'password',
              nullable: true,
              description: 'Optional password for Firebase user creation',
            },
          },
        },
        StudentUserCreationDto: {
          type: 'object',
          required: ['email', 'first_name', 'last_name', 'school_id'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Student email address',
            },
            first_name: {
              type: 'string',
              description: 'Student first name',
            },
            last_name: {
              type: 'string',
              description: 'Student last name',
            },
            middle_name: {
              type: 'string',
              nullable: true,
              description: 'Student middle name',
            },
            student_number: {
              type: 'string',
              nullable: true,
              description: 'Student number',
            },
            grade_level: {
              type: 'integer',
              minimum: -2,
              maximum: 12,
              nullable: true,
              description: 'Student grade level',
            },
            school_id: {
              type: 'string',
              description: 'School ID',
            },
            password: {
              type: 'string',
              format: 'password',
              nullable: true,
              description: 'Optional password for Firebase user creation',
            },
          },
        },
        AuthTokens: {
          type: 'object',
          required: ['accessToken', 'refreshToken', 'user'],
          properties: {
            accessToken: {
              type: 'string',
              description: 'JWT access token',
            },
            refreshToken: {
              type: 'string',
              description: 'JWT refresh token',
            },
            user: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'User ID',
                },
                email: {
                  type: 'string',
                  format: 'email',
                  description: 'User email',
                },
                user_type: {
                  type: 'string',
                  enum: ['student', 'staff', 'guardian'],
                  description: 'User type',
                },
                entity_id: {
                  type: 'string',
                  description:
                    'ID of the related entity (staff/student/guardian)',
                },
                firebase_uid: {
                  type: 'string',
                  description: 'Firebase user ID',
                },
              },
            },
          },
        },
        RefreshTokenDto: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: {
              type: 'string',
              description: 'Refresh token',
            },
          },
        },
        ForceLogoutDto: {
          type: 'object',
          required: ['userId'],
          properties: {
            userId: {
              type: 'string',
              description: 'ID of the user to force logout',
            },
          },
        },
        CreateUserDto: {
          type: 'object',
          required: ['email', 'user_type', 'entity_id'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            user_type: {
              type: 'string',
              enum: ['student', 'staff', 'guardian'],
              description: 'User type',
            },
            entity_id: {
              type: 'string',
              description: 'ID of the related entity (staff/student/guardian)',
            },
            first_name: {
              type: 'string',
              nullable: true,
              description: 'User first name',
            },
            last_name: {
              type: 'string',
              nullable: true,
              description: 'User last name',
            },
            firebase_uid: {
              type: 'string',
              nullable: true,
              description: 'Firebase user ID',
            },
          },
        },
        UpdateUserDto: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            first_name: {
              type: 'string',
              nullable: true,
              description: 'User first name',
            },
            last_name: {
              type: 'string',
              nullable: true,
              description: 'User last name',
            },
            firebase_uid: {
              type: 'string',
              nullable: true,
              description: 'Firebase user ID',
            },
          },
        },
      },
    },
  },
  apis: ['./src/modules/*/routes/*.ts', './src/modules/*/*.routes.ts'],
};

const specs = swaggerJSDoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
};
