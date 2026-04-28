export interface NotionProperty {
  id: string;
  type: string;
  [key: string]: any;
}

export interface ExpenseRecord {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
}

// Map from Notion Properties to our Record
export interface NotionPage {
  id: string;
  properties: {
    [key: string]: {
      id: string;
      type: string;
      [key: string]: any;
    };
  };
  created_time: string;
}
