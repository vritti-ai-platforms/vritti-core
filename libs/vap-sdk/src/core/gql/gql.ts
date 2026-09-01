/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": typeof types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": typeof types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": typeof types.VerifySmsOtpDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": typeof types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": typeof types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": typeof types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": typeof types.AddPersonCommunicationDocument,
};
const documents: Documents = {
    "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": types.SendWhatsappOtpDocument,
    "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifyWhatsappOtpDocument,
    "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n": types.SendSmsOtpDocument,
    "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n": types.VerifySmsOtpDocument,
    "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n": types.PersonFieldsFragmentDoc,
    "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n": types.PersonCommunicationFieldsFragmentDoc,
    "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.PeopleByCommunicationDocument,
    "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n": types.CreatePersonDocument,
    "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n": types.AddPersonCommunicationDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"): (typeof documents)["\n  mutation SendWhatsappOtp($input: SendWhatsappOtpInput!) {\n    sendWhatsappOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n"): (typeof documents)["\n  mutation VerifyWhatsappOtp($input: VerifyWhatsappOtpInput!) {\n    verifyWhatsappOtp(input: $input) {\n      verified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"): (typeof documents)["\n  mutation SendSmsOtp($input: SendSmsOtpInput!) {\n    sendSmsOtp(input: $input) {\n      sent\n      expiresAt\n      resendAvailableAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n"): (typeof documents)["\n  mutation VerifySmsOtp($input: VerifySmsOtpInput!) {\n    verifySmsOtp(input: $input) {\n      verified\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n"): (typeof documents)["\n  fragment PersonFields on Person {\n    id\n    displayName\n    firstName\n    lastName\n    email\n    phone\n    isActive\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n"): (typeof documents)["\n  fragment PersonCommunicationFields on PersonCommunication {\n    id\n    channel\n    value\n    isPrimary\n    isActive\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n"): (typeof documents)["\n  query PeopleByCommunication($input: FindPeopleByCommunicationInput!) {\n    peopleByCommunication(input: $input) {\n      ...PersonFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePerson($input: CreatePersonInput!) {\n    createPerson(input: $input) {\n      ...PersonFields\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n"): (typeof documents)["\n  mutation AddPersonCommunication($input: AddPersonCommunicationInput!) {\n    addPersonCommunication(input: $input) {\n      ...PersonCommunicationFields\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;