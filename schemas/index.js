import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connect = () => {
  mongoose
    .connect(process.env.DB_URI, {
      dbName: 'todo_memo', // todo_memo 데이터베이스명을 사용합니다.
    })
    .then(() => console.log('MongoDB 연결에 성공했습니다.'))
    .catch((err) => console.log(`MongoDB 연결에 실패했습니다. ${err}`));
};

mongoose.connection.on('error', (err) => {
  console.error('MongoDB 연결 에러', err);
});

export default connect;
