import { gql } from 'graphql-request';

import { ContactInfo } from './types';

interface BaseApiResponse {
  data: object;
  account_id: number;
}

// wrapper around the Monday GraphQL API
// down the line we might want to validate the query string itself, but it's pretty lenient for now
async function monday<ResponseType>(
  graphQLQuery: string
): Promise<ResponseType> {
  const mondayHeaders = new Headers();
  mondayHeaders.append(
    'Authorization',
    process.env.MONDAY_PERSONAL_API_KEY || ''
  );
  mondayHeaders.append('Content-Type', 'application/json');
  mondayHeaders.append('API-Version', '2023-04');

  console.debug(graphQLQuery);

  const mondayRequest = new Request('https://api.monday.com/v2', {
    method: 'POST',
    headers: mondayHeaders,
    body: JSON.stringify({
      query: `query { ${graphQLQuery} }`,
    }),
  });

  const mondayResponse = await fetch(mondayRequest);

  return mondayResponse.json();
}

// collects contact info for top-level items containing the contact name and email of the client
const parentContactInfoRequest = (parentItemId: string) => gql`
  items(ids:[${parentItemId}]){
    id
    name
    column_values(ids:["email", "text"]){
      id
      text
      type
    }
  }
`;

interface ContactInfoResponse extends BaseApiResponse {
  data: {
    items: {
      id: string;
      name: string;
      column_values: {
        id: string;
        text: string;
        type: 'text' | 'email';
      }[];
    }[];
  };
}

export const getContactInfo = async (
  parentItemId: string
): Promise<ContactInfo> => {
  const response = await monday<ContactInfoResponse>(
    parentContactInfoRequest(parentItemId)
  );

  const {
    data: {
      items: [{ name: projectName, column_values }],
    },
  } = response;

  const [nameColVal, emailColVal] = column_values;

  return {
    name: nameColVal.text,
    email: emailColVal.text,
    projectName,
  };
};

// requests hydrated item information
const itemInfoRequest = (itemId: string) => gql`
  items(ids:[${itemId}]){
    id
    name
    column_values(types:[text, status, timeline, progress, date, timeline, email]){
      id
      text
      type
    }
    subitems {
      id
    }
  }
`;

interface ItemInfoResponse extends BaseApiResponse {
  data: {
    items: {
      id: string;
      name: string;
      column_values: {
        id: string;
        text: string;
        type: string;
      }[];
      subitems: {
        id: string;
      }[];
    }[];
  };
}

export const getItemInfo = async (
  itemId: string
): Promise<ItemInfoResponse['data']> => {
  const response = await monday<ItemInfoResponse>(itemInfoRequest(itemId));

  return response.data;
};

const userRequest = gql`
  me {
    name
  }
`;

interface UserResponse extends BaseApiResponse {
  data: {
    me: {
      name: string;
    };
  };
}

export const getUser = async (): Promise<UserResponse> => monday(userRequest);
