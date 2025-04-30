import UserList from "./UserList"
import "../../assets/styles/list.css";
import UserInfo from "./UserInfo";

const List = () => {
  return (
    <div className='list'>
      <UserInfo/>
      <UserList/>
    </div>
  )
}

export default List