# Hướng dẫn setup & chạy dự án (Local)

## Yêu cầu môi trường

- **NodeJS >= 22** (khuyến nghị)
  - Trên Windows nên dùng **Node Version Manager (NVM)** cài từ GitHub
  - Có thể dùng installer hoặc Docker nếu quen
  - Hiện tại project được test với **NodeJS 24 LTS**

## Setup MetaMask cho Localhost

> Yêu cầu: đã cài MetaMask và chạy trên **chính máy local**

### Bước 1: Chạy Hardhat node

```bash
npx hardhat node
```

- Terminal sẽ hiện ~20 account
- Mỗi account có:
  - Address
  - Private Key
  - ~10,000 ETH local

---

### Bước 2: Import account vào MetaMask

1. Mở MetaMask
2. Chọn **Add account / Import account**
3. Dán **Private Key** lấy từ terminal Hardhat node

---

### Bước 3: Thêm network Localhost vào MetaMask

Chọn **Add network (Custom RPC)** và điền:

- **Network Name**: Tuỳ ý
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: Tuỳ ý
- **Block Explorer URL**: bỏ trống (skip)

 Khi chọn đúng **account + network** mà thấy **~10,000 ETH** là OK

---

## Thứ tự chạy (3 terminal riêng biệt)

### Terminal 1 – chạy blockchain local

```bash
npx hardhat node
```

### Terminal 2 – deploy contract

```bash
npx hardhat run scripts/deploy.ts --network localhost
```
Sau khi chạy xong, terminal sẽ in ra địa chỉ contract vừa deploy local

Copy địa chỉ contract này và dán vào frontend/src/contract.ts để frontend biết gọi đúng smart contract

### Terminal 3 – chạy Frontend

```bash
npm run dev
```