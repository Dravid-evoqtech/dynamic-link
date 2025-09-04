declare module '@invertase/react-native-apple-authentication/lib/AppleAuthModule' {
  import { NativeEventEmitter } from 'react-native';

  export default class AppleAuthModule {
    constructor(nativeModule: any);
    
    native: any;
    emitter: NativeEventEmitter;
    
    Error: {
      UNKNOWN: string;
      CANCELED: string;
      INVALID_RESPONSE: string;
      NOT_HANDLED: string;
      FAILED: string;
    };
    
    Operation: {
      IMPLICIT: number;
      LOGIN: number;
      REFRESH: number;
      LOGOUT: number;
    };
    
    Scope: {
      EMAIL: number;
      FULL_NAME: number;
    };
    
    UserStatus: {
      UNSUPPORTED: number;
      UNKNOWN: number;
      LIKELY_REAL: number;
    };
    
    State: {
      REVOKED: number;
      AUTHORIZED: number;
      NOT_FOUND: number;
      TRANSFERRED: number;
    };
    
    get isSupported(): boolean;
    get isSignUpButtonSupported(): boolean;
    
    getCredentialStateForUser(user: string): Promise<number>;
    performRequest(requestOptions?: any): Promise<any>;
    onCredentialRevoked(listener: Function): () => void | undefined;
  }
}
