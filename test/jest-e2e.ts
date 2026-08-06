import { pathsToModuleNameMapper } from 'ts-jest';

import { compilerOptions } from '../tsconfig.json';

const moduleNameMapper = pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../'
});

export default {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testEnvironment: 'node',
    testRegex: '.e2e-spec.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest'
    },
    moduleNameMapper: {
        '^@prisma/client$': '<rootDir>/../node_modules/@prisma/client',
        '^@prisma/client/(.*)$': '<rootDir>/../node_modules/@prisma/client/$1',
        ...moduleNameMapper
    }
};
