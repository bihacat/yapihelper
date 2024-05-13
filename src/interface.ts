export interface ApiDataType {
  __v: number;
  _id: number;
  add_time: number;
  catid: number;
  desc: string;
  markdown: string;
  method: string;
  path: string;
  project_id: number;
  req_body_other: string;
  req_body_type: string;
  res_body: string;
  res_body_type: string;
  service: string;
  title: string;
  uid: number;
  up_time: number;
  index: number;
  api_opened: boolean;
  res_body_is_json_schema: boolean;
  req_body_form: unknown[];
  req_body_is_json_schema: boolean;
  req_params: unknown[];
  req_headers: {
    _id: string;
    value: string;
    name: string;
    required: string;
  }[],
  req_query: [],
  query_path: {
    path: string;
    params: unknown[];
  },
  type: string;
  status: string;
  edit_uid: 0,
  username: string;
}

export interface PropertyType {
  type: string;
  description: string;
};

export type PropertyItemsType = PropertyType & {
  properties: PropertiesType
};

export type PropertiesValType = PropertyType & {
  items?: PropertyItemsType;
};

export interface PropertiesType {
  [x: string]: PropertiesValType;
}

export type TypeMapType = Record<string, string>;