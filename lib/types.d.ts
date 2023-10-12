import { type MessagesSendTemplateRequest } from '@mailchimp/mailchimp_transactional';
import { type UUID as uuid } from 'crypto';

// MAILCHIMP
export type Template =
  | 'project-update'
  | 'project-kickoff'
  | 'project-complete'
  | 'lead-to-client';

interface Content {
  name: string;
  content: string;
}

export interface Contact {
  name: string;
  email: string;
}

export interface ContactInfo extends Contact {
  projectName: string;
}

export type MessageContent = Content[];

export interface Notification extends MessagesSendTemplateRequest {
  template_name: Template;
  template_content: [];
  message: {
    global_merge_vars: Content[];
    to: Contact[];
  };
}

export type ProjectUpdateContent = [
  {
    name: 'client';
    content: string;
  },
  {
    name: 'project_name';
    content: string;
  },
  {
    name: 'update';
    content: string;
  }
];

export type ProjectKickoffContent = [
  {
    name: 'client';
    content: string;
  },
  {
    name: 'project_name';
    content: string;
  }
];

export type ProjectCompleteContent = [
  {
    name: 'client';
    content: string;
  },
  {
    name: 'change_order';
    content: string;
  }
];

// MONDAY
declare namespace MondayWebhookEvents {
  // ------------- BASE TYPES -----------------
  type EventType = 'create_pulse' | 'create_update' | 'update_column_value';

  interface BaseEvent {
    userId: number;
    originalTriggerUuid: uuid | null;
    boardId: number;
    pulseId: number;
    replyId: number | null;
    app: 'monday';
    type: EventType;
    triggerTime: string;
    subscriptionId: number;
    triggerUuid: string;
    isTopGroup: boolean;
  }

  interface ChildItem {
    parentItemId?: string;
    parentItemBoardId?: string;
  }

  interface ParentItem {
    parentItemId: never;
    parentItemBoardId: never;
  }

  interface StatusColumnValue {
    label: {
      index: number;
      text: string;
      style: {
        color: string;
        border: string;
        var_name: string;
      };
      is_done: boolean;
    };
    post_id: number | null;
  }

  export interface ValueChange<T> {
    value: T;
    previousValue: T | null;
  }

  // ------------- API TYPES -----------------
  export interface CreateItemEvent extends BaseEvent, ParentItem {
    type: 'create_pulse';
    groupName: string;
    groupColor: string;
    columnValues: object;
  }

  export interface CreateSubItemEvent extends BaseEvent, ChildItem {
    type: 'create_pulse';
    itemId: number;
    groupName: string;
    groupColor: string;
    columnValues: object;
  }

  // need to create a generic since the type of the column can vary so widely
  export interface ChangeColumnValueEvent<T> extends BaseEvent, ValueChange<T> {
    type: 'update_column_value';
    groupId: string;
    pulseName: string;
    columnId: string;
    columnType: string;
    columnTitle: string;
  }

  export interface StatusColumnChangeEvent
    extends BaseEvent,
      ChildItem,
      ValueChange<StatusColumnValue> {
    type: 'update_column_value';
    groupId: string;
    pulseName: string;
    columnId: string;
    columnType: string;
    columnTitle: string;
  }

  export interface ItemUpdateEvent extends BaseEvent, ParentItem {
    type: 'create_update';
    body: string;
    textBody: string;
    updateId: number;
    replyId: number | null;
    isTopGroup: never;
  }

  export interface SubitemUpdateEvent extends BaseEvent, ChildItem {
    type: 'create_update';
    body: string;
    textBody: string;
    updateId: number;
    replyId: number | null;
    isTopGroup: never;
  }
}
