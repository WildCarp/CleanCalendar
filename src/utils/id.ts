// UUID 生成（crypto.randomUUID，所有现代浏览器支持）
export function generateId(): string {
  return crypto.randomUUID();
}
