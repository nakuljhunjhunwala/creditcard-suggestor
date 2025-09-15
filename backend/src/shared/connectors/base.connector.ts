export abstract class BaseConnector<T> {
  protected instance: T | null = null;
  private static instances: Map<string, unknown> = new Map();

  public abstract connect(): Promise<T>;
  public abstract disconnect(): Promise<void>;
  public abstract healthCheck(): Promise<boolean>;

  public static getInstance<T extends BaseConnector<unknown>>(
    this: new () => T,
  ): T {
    const className = this.name;
    if (!BaseConnector.instances.has(className)) {
      BaseConnector.instances.set(className, new this());
    }
    return BaseConnector.instances.get(className) as T;
  }

  public async getClient(): Promise<T> {
    this.instance ??= await this.connect();
    return this.instance;
  }
}
