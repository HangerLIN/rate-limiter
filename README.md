# 分布式限流系统

本项目实现了四种常见的限流算法，包括单机版和基于Redis的分布式版本。

## 项目结构

- `rate-limiter-standalone`：单机版限流器实现
- `rate-limiter-redis`：基于Redis的分布式限流器实现

## 限流算法选择指南

不同场景下应选择不同的限流算法：

| 算法 | 适用场景 | 优点 | 缺点 |
| --- | --- | --- | --- |
| 固定窗口计数器 | 简单的API限流<br>并发量不高的场景 | 实现简单<br>内存占用小 | 边界突刺问题<br>临界点可能超限 |
| 滑动窗口计数器 | 对限流精度要求高<br>请求分布均匀 | 解决边界突刺问题<br>限流更平滑 | 实现复杂<br>内存占用增加 |
| 漏桶算法 | 削峰填谷<br>请求量超过处理能力 | 流量整形能力强<br>出口速率恒定 | 突发流量处理不够灵活<br>不支持突发流量 |
| 令牌桶算法 | 允许突发流量<br>流量间歇性的场景 | 流量控制灵活<br>允许一定突发流量 | 参数调优复杂<br>初始状态可能过于宽松 |

### 选择流程

1. **需要处理突发流量？**
   - 是 → 选择**令牌桶算法**
   - 否 → 转到步骤2

2. **需要稳定的流量输出？**
   - 是 → 选择**漏桶算法**
   - 否 → 转到步骤3

3. **对精确度要求高？**
   - 是 → 选择**滑动窗口算法**
   - 否 → 选择**固定窗口算法**

4. **是否需要分布式限流？**
   - 是 → 使用对应的Redis实现版本
   - 否 → 使用单机版实现

## 限流算法详解

### 1. 固定窗口计数器算法 (Fixed Window Counter)

**基本原理：**
固定窗口算法将时间划分为固定大小的窗口（如1秒），在每个窗口内维护一个计数器，记录该窗口内的请求数。当窗口内请求数超过阈值时，拒绝新的请求；当时间窗口结束时，计数器重置。

**实现核心代码：**
```java
if (now - preStartTime < 1000) {
    if (counter < perSecondLimit) {
        counter++;
        return true;
    } else {
        return false;
    }
}
counter = 0;
preStartTime = now;
return true;
```

**优缺点：**
- 优点：实现简单，内存占用少
- 缺点：存在临界点问题，可能在窗口边界造成突刺

### 2. 滑动窗口计数器算法 (Sliding Window Counter)

**基本原理：**
滑动窗口算法将固定窗口细分为多个小窗口，通过滑动窗口的方式，使限流更加平滑。每次请求到来时，会计算当前时间所在的小窗口，并检查所有小窗口的请求总数是否超过阈值。

**实现核心代码：**
```java
long currentTime = System.currentTimeMillis();
if (currentTime > windowRightBorder) {
    do {
        windowId = (++windowId) % windowNum;
        totalCount -= perWindowCount[windowId];
        perWindowCount[windowId] = 0;
        windowRightBorder += perWindowSize;
    } while (windowRightBorder < currentTime);
}
if (totalCount < maxRequestCount) {
    perWindowCount[windowId]++;
    totalCount++;
    return true;
}
return false;
```

**优缺点：**
- 优点：解决了固定窗口的临界点问题，限流更加平滑
- 缺点：实现复杂，内存占用较大

### 3. 漏桶算法 (Leaky Bucket)

**基本原理：**
漏桶算法将请求比作水，水以任意速率流入漏桶，但水以固定速率从漏桶流出。当水超过漏桶容量时，新流入的水会溢出（被拒绝）。

**实现核心代码：**
```java
private void leak() {
    long currentTime = System.currentTimeMillis();
    long leakWater = (currentTime - lastLeakTime) * rate / 1000;
    count = Math.max(count - leakWater, 0);
    lastLeakTime = currentTime;
}

public synchronized boolean tryAcquire() {
    this.leak();
    if (count < capacity) {
        count++;
        return true;
    }
    return false;
}
```

**优缺点：**
- 优点：出口速率恒定，适合流量整形
- 缺点：不能处理突发流量，即使系统空闲也无法提高处理速率

### 4. 令牌桶算法 (Token Bucket)

**基本原理：**
令牌桶算法以固定速率往桶中放入令牌，每个请求需要获取一个令牌才能被处理。当桶中无令牌时，请求被拒绝。桶满时多余的令牌会被丢弃。

**实现核心代码：**
```java
private void generateTokens() {
    long currentTime = System.currentTimeMillis();
    long tokens = (currentTime - lastGenerateTime) * tokenRate / 1000;
    count = Math.min(count + tokens, capacity);
    lastGenerateTime = currentTime;
}

public boolean limit() {
    this.generateTokens();
    if (count > 0) {
        count--;
        return true;
    }
    return false;
}
```

**优缺点：**
- 优点：能够应对突发流量，处理更灵活
- 缺点：参数调优复杂，初始状态可能过于宽松 