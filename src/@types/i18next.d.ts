import { resources, defaultNS } from "../lib/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
    returnNull: false;
    returnEmptyString: false;
    keySeparator: ".";
    nsSeparator: ":";
  }
}

// Allow any string as translation key
declare module "react-i18next" {
  interface TFunction {
    (key: string, options?: any): string;
    (key: string, defaultValue: string, options?: any): string;
  }
}
