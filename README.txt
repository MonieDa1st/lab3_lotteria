Bắt buộc nodeJS >= ver 22 
(khuyến nghị nếu sài window thì nên dùng Node Version Manager down từ github, ko
thì installer hay docker cũng đc, t đang dùng 24 lts)

Lưu ý: 
    1/ Do testnet y/c metamask phải có 0.001eth main net mới cho mấy đồng testnet nên
t deploy local luôn
    2/ Dù deploy local nhưng vẫn cần metamask, sẽ chỉ cách lấy private key để mng
nhét 1 acc có network là máy local (10k eth thì phải, ko rõ có vô hạn ko)

Module dùng (ko rõ có nhận trong node_modules ko nên để đây để có gì install lại):
    "@nomicfoundation/hardhat-ignition": "^3.0.6",
    "@nomicfoundation/hardhat-toolbox-viem": "^5.0.1",
    "@nomicfoundation/hardhat-viem": "^3.0.1",
    "@types/chai": "^5.2.3", (có thể không cần)
    "@types/mocha": "^10.0.10", (có thể không cần)
    "@types/node": "^22.19.3", (có thể không cần)
    "chai": "^6.2.1", (có thể không cần)
    "forge-std": "github:foundry-rs/forge-std#v1.9.4",
    "hardhat": "^3.1.0", (cái này doc official recomend, khác với utube là ver 2.5)
    "mocha": "^11.7.5",
    "typescript": "~5.8.0",
    "viem": "^2.43.1" (tương thích với hardhat 3 hơn ethers.js,
chỉnh về ethers khá phiền nên dùng luôn)

Cách chạy vài thứ mới mò đc:
1/Compile contracts + run scripts + test:
    +npx hardhat clean (xoá folder artifacts chứa abi chỉ hardhat đọc đc)
    +npx hardhat compile (compile contracts + sinh artifacts)
    +npx hardhat run scripts/deploy.ts (chạy deploy.ts để print địa chỉ 
đóng contract local) -- nếu có lỗi không kết nối được contract thì chạy npx hardhat run scripts/deploy.ts --network localhost
    +npx hardhat test (chạy file test :D )

2/ Cách setup cho FrontEnd (Yêu cầu tạo trước metamask và chạy trên chính máy local)
    +Chạy 1 terminal ở folder gốc npx hardhat node
    +Sẽ hiện tầm 20 acc (kèm private key) cho ~10k eth local
    +Vào metamask, chọn thêm account rồi import private key
    +Điền các thông số như sau:
        -Network name : Tuỳ ý
        -RPC URL : http://127.0.0.1:8545
        -Chain ID : 31337
        -Currency(Đơn vị tiền) : tuỳ ý
    +Ở metamask, chọn Network -> add Network tuỳ chỉnh, 
điền các thông số tương tự, skip cái URL trình khám phá khối
==>Khi vào đúng acc + network thấy 10k eth là ok
chạy front end thì sài lệnh npm run dev