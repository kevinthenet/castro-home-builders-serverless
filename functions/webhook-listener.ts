import * as mailchimp from '@mailchimp/mailchimp_transactional';

import { getContactInfo } from '../lib/monday';
import {
  ContactInfo,
  MessageContent,
  MondayWebhookEvents,
  Notification,
  ProjectUpdateContent,
  Template,
} from '../lib/types';

import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
const mailchimpClient = mailchimp(process.env.MANDRILL_API_KEY || '');

export const webhookListener = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  if (!event.body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'no event body provided' }),
    };
  }

  const { event: mondayEvent = {} } =
    typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

  const { type = 'not_found' } = mondayEvent as
    | MondayWebhookEvents.StatusColumnChangeEvent
    | MondayWebhookEvents.ItemUpdateEvent
    | MondayWebhookEvents.SubitemUpdateEvent;

  const parentItemId = mondayEvent.parentItemId || null;
  const hasParent = !!parentItemId;

  let template: Template;
  let contactInfo: ContactInfo;
  let messageContent: MessageContent = [];

  switch (type) {
    case 'update_column_value':
      template = 'project-update';
      contactInfo = await getContactInfo(parentItemId);

      const { pulseName, value } =
        mondayEvent as MondayWebhookEvents.StatusColumnChangeEvent;

      const {
        label: { text, is_done },
      } = value;

      const taskCompletionText = `The task: ${pulseName} has been marked as ${text.toLowerCase()}.  ${
        is_done
          ? `We're excited to continue forward with the project, if you have any questions please let us know by replying to this email.`
          : `We will address this issue as soon as possible and provide prompt update when possible.`
      }`;

      messageContent = [
        { name: 'client', content: contactInfo.name },
        { name: 'project_name', content: contactInfo.projectName },
        {
          name: 'update',
          content: taskCompletionText,
        },
      ] as ProjectUpdateContent;
      break;
    case 'create_update':
      template = 'project-update';
      if (hasParent) {
        contactInfo = await getContactInfo(parentItemId);
      } else {
        contactInfo = await getContactInfo(mondayEvent.pulseId);
      }

      const { body: updateText } =
        mondayEvent as MondayWebhookEvents.SubitemUpdateEvent;

      messageContent = [
        { name: 'client', content: contactInfo.name },
        { name: 'project_name', content: contactInfo.projectName },
        {
          name: 'update',
          content: updateText,
        },
      ] as ProjectUpdateContent;
      break;
    default:
      console.error(
        `Unhandled webhook event: [type: ${type}] [body: ${JSON.stringify(
          event.body
        )}]`
      );
      return {
        statusCode: 422, // unprocessable entity
        body: JSON.stringify({ error: `event type: ${type} not supported` }),
      };
  }

  console.debug({ template, contactInfo, messageContent });

  let notification: Notification = {
    template_name: template,
    template_content: [],
    message: {
      to: [{ name: contactInfo.name, email: contactInfo.email }],
      global_merge_vars: [...messageContent],
    },
  };

  const sendResponse = await mailchimpClient.messages.sendTemplate(
    notification
  );

  console.debug({ sendResponse });

  return {
    statusCode: 200,
    body: event.body!,
  };
};
