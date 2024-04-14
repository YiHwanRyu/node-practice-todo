import express from 'express';
import Todo from '../schemas/todo.schema.js';
import joi from 'joi';

const router = express.Router();

/** 할 일 생성 API 유효성 검사 요구사항
1. value 데이터는 필수적으로 존재해야한다.
2. value 데이터는 문자열 타입이어야한다.
3. value 데이터는 최소 1글자 이상이어야한다.
4. value 데이터는 최대 50글자 이하여야한다.
5. 유효성 검사에 실패했을 때, 에러가 발생해야한다
 */
const createdTodoSchema = joi.object({
  value: joi.string().min(1).max(50).required(),
});

// 해야할 일 등록
router.post('/todos', async (req, res, next) => {
  try {
    // 1. 클라이언트에게 전달받은 value 데이터를 변수에 저장합니다.
    // const { value } = req.body;
    const validation = await createdTodoSchema.validateAsync(req.body);

    const { value } = validation;

    // 만약, 클라이언트가 value 데이터를 전달하지 않았을 때, 클라이언트에게 에러 메세지를 전달한다.
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: '해야할 일(value) 데이터가 존재하지 않습니다.' });
    }

    // 2. Todo모델을 사용해, MongoDB에서 'order' 값이 가장 높은 '해야할 일'을 조회.
    // sort = 정렬한다. -> 어떤 칼럼을? -> 내림차순(-order)
    // .exec() promise 형태로 사용하기 위해 필수! 안쓰면 await이 있으나 마나임.
    const todoMaxOrder = await Todo.findOne().sort('-order').exec();

    // 3. 'order'값이 가장 높은 도큐멘트에 1을 추가하거나 없다면, 1을 할당합니다.
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    // 4. Todo모델을 이용해, 새로운 '해야할 일'을 생성합니다.
    const todo = new Todo({ value, order });

    // 5. 생성한 '해야할 일'을 MongoDB에 저장합니다.
    await todo.save();

    return res.status(201).json({ todo });
  } catch (error) {
    // Router 다음에 있는 에러 처리 미들웨어를 실행한다.
    next(error);
  }
});

// 해야할 일 목록 조회
router.get('/todos', async (req, res, next) => {
  // 1. 해야할 일 목록 조회를 진행한다.
  const todos = await Todo.find().sort('-order').exec();

  // 2. 해야할 일 목록 조회 결과를 클라이언트에게 반환한다.
  return res.status(200).json({ todos });
});

// 해야할 일 순서, 했는지 여부 변경 api
router.patch('/todos/:todoId', async (req, res, next) => {
  const { todoId } = req.params;
  const { order, done, value } = req.body;

  // 현재 나의 order가 무엇인지 알아야 한다.
  const currentTodo = await Todo.findById(todoId).exec();

  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 해야할 일입니다.' });
  }

  // 바뀔 순서의 todo가 존재하면 서로 바꿔줌.
  if (order) {
    const targetTodo = await Todo.findOne({ order }).exec();

    if (targetTodo) {
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }

    currentTodo.order = order;
  }

  // null이나 true면 실행하도록
  if (done !== undefined) {
    currentTodo.doneAt = done ? new Date() : null;
  }

  if (value) {
    currentTodo.value = value;
  }

  await currentTodo.save();

  return res.status(200).json({});
});

// 할 일 삭제 API
router.delete('/todos/:todoId', async (req, res, next) => {
  const { todoId } = req.params;

  const todo = await Todo.findById(todoId).exec();

  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 해야할 일 정보입니다.' });
  }

  await Todo.deleteOne({ _id: todoId });

  return res.status(200).json({});
});

export default router;
