import { useState, useEffect, useCallback } from "react";
import _ from "lodash";
import style from "../src/Departments.module.css";
import avatar from "../src/images/avatar-svgrepo-com.svg";

type TDepartment = {
  ID: string;
  NAME: string;
  SORT: number;
  UF_HEAD: string;
  PARENT: string | null;
  children: TDepartment[];
};

type TUser = {
  ACTIVE: boolean;
  DATE_REGISTER: string;
  EMAIL: string;
  ID: string;
  IS_ONLINE: string;
  LAST_ACTIVITY_DATE: {};
  LAST_LOGIN: string;
  LAST_NAME: string;
  NAME: string;
  PERSONAL_BIRTHDAY: string;
  PERSONAL_CITY: string;
  PERSONAL_COUNTRY: string;
  PERSONAL_FAX: string;
  PERSONAL_GENDER: string;
  PERSONAL_ICQ: string;
  PERSONAL_MAILBOX: string;
  PERSONAL_MOBILE: string;
  PERSONAL_NOTES: string;
  PERSONAL_PAGER: string;
  PERSONAL_PHONE: string;
  PERSONAL_PHOTO: string;
  PERSONAL_PROFESSION: string;
  PERSONAL_STATE: string;
  PERSONAL_STREET: string;
  PERSONAL_WWW: string;
  PERSONAL_ZIP: string;
  SECOND_NAME: string;
  TIMESTAMP_X: {};
  TIME_ZONE: string;
  TIME_ZONE_OFFSET: string;
  TITLE: string;
  UF_DEPARTMENT: number[];
  UF_EMPLOYMENT_DATE: string;
  UF_USR_1728984148328: boolean;
  UF_USR_1728984163776: boolean;
  UF_USR_1728984222671: boolean;
  UF_USR_1731608997996: string;
  USER_TYPE: string;
  WORK_CITY: string;
  WORK_COMPANY: string;
  WORK_COUNTRY: string;
  WORK_DEPARTMENT: string;
  WORK_FAX: string;
  WORK_MAILBOX: string;
  WORK_NOTES: string;
  WORK_PAGER: string;
  WORK_PHONE: string;
  WORK_POSITION: string;
  WORK_PROFILE: string;
  WORK_STATE: string;
  WORK_STREET: string;
  WORK_WWW: string;
  WORK_ZIP: string;
  XML_ID: string;
  create_account?: string;
  account_name?: string;
  ip_base_station?: string;
  computer_name?: string;
  computer_domain_reg?: string;
  log_on?: string;
  phone_number?: string;
  hasApiData?: boolean;
};

type TApiUser = {
  ID: string;
  create_account?: string;
  ip_base_station?: string;
  computer_name?: string;
  computer_domain_reg?: string;
  log_on?: string;
  phone_number?: string;
};

const cacheData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getCachedData = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

const Departments = () => {
  const [departments, setDepartments] = useState<TDepartment[]>([]);
  const [users, setUsers] = useState<TUser[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredDepartments, setFilteredDepartments] = useState<
    { department: TDepartment; users: TUser[] }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const fetchDepartments = async (start: number, count: number) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_DEPT_URL}?start=${start}&count=${count}`
      );
      const data = await response.json();
      return data.result;
    } catch (error) {
      setError(error as Error);
    }
  };

  const fetchUsers = async (start: number, count: number) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_USERS_URL}?start=${start}&count=${count}`
      );
      const data = await response.json();
      return data.result;
    } catch (error) {
      setError(error as Error);
    }
  };

  const createDepartmentHierarchy = (departments: TDepartment[]) => {
    const departmentMap = new Map<string, TDepartment>();

    departments.forEach((dept) => {
      departmentMap.set(dept.ID, { ...dept, children: [] });
    });

    const rootDepartments: TDepartment[] = [];

    departmentMap.forEach((dept) => {
      if (dept.PARENT && departmentMap.has(dept.PARENT)) {
        departmentMap.get(dept.PARENT)!.children.push(dept);
      } else {
        rootDepartments.push(dept);
      }
    });

    return rootDepartments;
  };

  // Функция loadDepartments: загружает список департаментов с сервера
  const loadDepartments = async () => {
    setLoading(true);
    
    // Проверяем, есть ли кэшированные данные
    const cachedDepartments = getCachedData('departments');
    if (cachedDepartments) {
      console.log('Using cached departments data');
      setDepartments(createDepartmentHierarchy(cachedDepartments));
      setLoading(false);
      return;
    }
  
    const departmentsList = [];
    let start = 0;
    let count = 50;
  
    while (true) {
      const departments = await fetchDepartments(start, count);
      departmentsList.push(...departments);
  
      if (departments.length < count) {
        break;
      }
  
      start += count;
    }
  
    // Кэшируем полученные данные
    cacheData('departments', departmentsList);
  
    const hierarchicalDepartments = createDepartmentHierarchy(departmentsList);
    setDepartments(hierarchicalDepartments);
    setLoading(false);
  };

// Функция loadUsers: загружает список пользователей с сервера и объединяет с данными API
const loadUsers = async () => {
  setLoading(true);

  // Проверяем, есть ли кэшированные данные
  const cachedUsers = getCachedData('users');
  if (cachedUsers) {
    console.log('Using cached users data');
    setUsers(cachedUsers);
    setLoading(false);
    return;
  }

  const usersList = [];
  let start = 0;
  let count = 50;

  while (true) {
    const users = await fetchUsers(start, count);
    usersList.push(...users);

    if (users.length < count) {
      break;
    }

    start += count;
  }

  const apiUsers = await fetchUsersAPI();

  const mergedUsers = usersList.map((user) => {
    const apiUser = apiUsers.find(
      (apiUser: TApiUser) => apiUser.ID.toString() === user.ID
    );
    if (apiUser) {
      const { ID, ...apiUserData } = apiUser;
      return { ...user, ...apiUserData, hasApiData: true };
    }
    return { ...user, hasApiData: false };
  });

  // Кэшируем полученные данные
  cacheData('users', mergedUsers);

  setUsers(mergedUsers);
  setLoading(false);
};

  // Функция fetchUsersAPI: получает дополнительные данные о пользователях из внешнего API
  const fetchUsersAPI = async () => {
    try {
      const response = await fetch(
        "https://run.mocky.io/v3/7560249a-e3a9-424e-8e91-b8818c71044f"
      );
      const data = await response.json();

      const usersData = data.map((userData: any) => ({
        ID: userData.id,
        create_account: userData.create_account,
        ip_base_station: userData.ip_base_station,
        computer_name: userData.computer_name,
        computer_domain_reg: userData.computer_domain_reg,
        log_on: userData.log_on,
        phone_number: userData.phone_number,
      }));
      return usersData;
    } catch (error) {
      console.error("Error fetching users:", error);
      return []; //
    }
  };

  const clearCache = () => {
    localStorage.removeItem('departments');
    localStorage.removeItem('users');
  };

  // useEffect: загружает данные при монтировании компонента
  useEffect(() => {
  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) {
      clearCache();
    }
    await loadDepartments();
    await loadUsers();
  };
  loadData();
}, []);

const handleRefresh = () => {
  const loadData = async () => {
    clearCache();
    await loadDepartments();
    await loadUsers();
  };
  loadData();
};
  

  // Функция handleSearch: обрабатывает поисковые запросы с дебаунсингом
  const handleSearch = useCallback(
    _.debounce((query: string) => {
      setIsSearching(true);
      if (!query || !query.trim()) {
        setFilteredDepartments([]);
        setIsSearching(false);
        return;
      }
  
      const isNumeric = /^\d+$/.test(query);
      const lowerQuery = query.toLowerCase().trim();
      const queryParts = lowerQuery.split(' ');
  
      let filteredResults: { department: TDepartment; users: TUser[] }[] = [];
  
      const searchInDepartment = (dept: TDepartment) => {
        let deptUsers: TUser[] = [];
  
        
        const usersInDepartment = users.filter((user) =>
          user.UF_DEPARTMENT.includes(parseInt(dept.ID))
        );
  
        if (isNumeric) {
          deptUsers = usersInDepartment.filter(
            (user) => user.ID === query
          );
        } else {
          if (dept.NAME && dept.NAME.toLowerCase().includes(lowerQuery)) {
            deptUsers = usersInDepartment;
          } else {
            deptUsers = usersInDepartment.filter(
              (user) => {
                const fullName = `${user.LAST_NAME} ${user.NAME} ${user.SECOND_NAME}`.toLowerCase();
                return queryParts.every(part => fullName.includes(part));
              }
            );
          }
        }
  
        if (deptUsers.length > 0) {
          filteredResults.push({ department: dept, users: deptUsers });
        }
  
        if (dept.children) {
          dept.children.forEach(searchInDepartment);
        }
      };
  
      departments.forEach(searchInDepartment);
  
      setFilteredDepartments(filteredResults);
      setIsSearching(false);
    }, 300),
    [departments, users]
  );

  // Основная ифна для карточки пользователя
  const userInfo = (user: TUser) => {
    return (
      <div className={style.infoContainer}>
                        <div className={style.imageContainer}>
                          <img
                            className={style.img}
                            src={user.PERSONAL_PHOTO || avatar}
                            alt="Личное фото"
                          />
                        </div>
                        <div className={style.userDetails}>
                          <p>
                            ID: <span>{user.ID}</span>
                          </p>
                          <p>
                            Работает:{" "}
                            <span>{user.ACTIVE ? "да" : "нет"}</span>
                          </p>
                          <p>
                            Дата регистрации:{" "}
                            <span>{user.DATE_REGISTER}</span>
                          </p>
                          <p>
                            EMAIL-рабочий:{" "}
                            <span>{user.EMAIL || "НЕ УКАЗАНО"}</span>
                          </p>
                          <p>
                            В сети:{" "}
                            <span>
                              {user.IS_ONLINE === "Y" ? "да" : "нет"}
                            </span>
                          </p>
                          <p>
                            Крайний логин: <span>{user.LAST_LOGIN}</span>
                          </p>
                          <p>
                            Дата рождения:{" "}
                            <span>
                              {user.PERSONAL_BIRTHDAY || "НЕ УКАЗАНО"}
                            </span>
                          </p>
                          <p>
                            Город:{" "}
                            <span>{user.PERSONAL_CITY || "НЕ УКАЗАНО"}</span>
                          </p>
                          <p>
                            EMAIL-личный:{" "}
                            <span>
                              {user.PERSONAL_MAILBOX || "НЕ УКАЗАНО"}
                            </span>
                          </p>
                          <p>
                            Личный мобильный:{" "}
                            <span>
                              {user.PERSONAL_MOBILE || "НЕ УКАЗАНО"}
                            </span>
                          </p>
                          <p>
                            Телефон:{" "}
                            <span>{user.PERSONAL_PHONE || "НЕ УКАЗАНО"}</span>
                          </p>
                          <p>
                            Профессия:{" "}
                            <span>
                              {user.PERSONAL_PROFESSION || "НЕ УКАЗАНО"}
                            </span>
                          </p>
                          <p>
                            Адрес:{" "}
                            <span>
                              {user.PERSONAL_STREET || "НЕ УКАЗАНО"}
                            </span>
                          </p>
                          <p>
                            Дата устройства:{" "}
                            <span>
                              {user.UF_EMPLOYMENT_DATE || "НЕ УКАЗАНО"}
                            </span>
                          </p>
                          {user.hasApiData && (
                            <div>
                              <p>
                                Дата создания аккаунта:{" "}
                                <span>
                                  {user.create_account || "НЕ УКАЗАНО"}
                                </span>
                              </p>
                              <p>
                                Имя аккаунта:{" "}
                                <span>
                                  {user.account_name || "НЕ УКАЗАНО"}
                                </span>
                              </p>
                              <p>
                                IP базовой станции:{" "}
                                <span>
                                  {user.ip_base_station || "НЕ УКАЗАНО"}
                                </span>
                              </p>
                              <p>
                                Имя компьютера:{" "}
                                <span>
                                  {user.computer_name || "НЕ УКАЗАНО"}
                                </span>
                              </p>
                              <p>
                                Домен компьютера:{" "}
                                <span>
                                  {user.computer_domain_reg || "НЕ УКАЗАНО"}
                                </span>
                              </p>
                              <p>
                                Логин:{" "}
                                <span>{user.log_on || "НЕ УКАЗАНО"}</span>
                              </p>
                              <p>
                                Номер телефона:{" "}
                                <span>
                                  {user.phone_number || "НЕ УКАЗАНО"}
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
    )
  }
 
// Функция renderDepartment: отрисовывает структуру отдельного департамента и его сотрудников
  const renderDepartment = (department: TDepartment) => {
    const usersInDepartment = users.filter((user) => {
      return user.UF_DEPARTMENT.includes(parseInt(department.ID));
    });

    const isSelected = selectedDepartments.includes(department.ID);

    return (
      <div className={style.departmentContainer} key={department.ID}>
        <div className={style.sidebar1}>
          <div
            className={`${style.details__title1} ${
              isSelected ? style.selected : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDepartments((prevSelected) =>
                isSelected
                  ? prevSelected.filter((id) => id !== department.ID)
                  : [...prevSelected, department.ID]
              );
            }}
          >
            {department.NAME}
          </div>
        </div>
        {isSelected && (
          <div className={style.content1}>
            <div className={style.departmentContent}>
              {usersInDepartment.map((user) => (
                <div className={style.userContainer} key={user.ID}>
                  <div className={style.userRow}>
                    <div
                      className={`${style.details__title2} ${
                        selectedUser === user.ID ? style.selected : ""
                      }`}
                      onClick={() =>
                        setSelectedUser(
                          selectedUser === user.ID ? null : user.ID
                        )
                      }
                    >
                      {user.LAST_NAME} {user.NAME} {user.SECOND_NAME}
                    </div>
                    {selectedUser === user.ID && (
                      <div className={style.userContent}>
                        {userInfo(user)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {department.children &&
                department.children.length > 0 &&
                department.children.map((child) => (
                  <div className={style.childDepartments} key={child.ID}>
                    {renderDepartment(child)}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Функция renderSearchResults: отрисовывает результаты поиска
  const renderSearchResults = (
    department: TDepartment,
    matchingUsers: TUser[]
  ) => {
    const isSelected = selectedDepartments.includes(department.ID);
  
    return (
      <div className={style.departmentContainer} key={department.ID}>
        <div className={style.sidebar1}>
          <div
            className={`${style.details__title1} ${
              isSelected ? style.selected : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedDepartments((prevSelected) =>
                isSelected
                  ? prevSelected.filter((id) => id !== department.ID)
                  : [...prevSelected, department.ID]
              );
            }}
          >
            {department.NAME} ({matchingUsers.length})
          </div>
        </div>
        {isSelected && (
          <div className={style.content1}>
            <div className={style.departmentContent}>
              {matchingUsers.map((user) => (
                <div className={style.userContainer} key={user.ID}>
                <div className={style.userRow}>
                  <div
                    className={`${style.details__title2} ${
                      selectedUser === user.ID ? style.selected : ""
                    }`}
                    onClick={() =>
                      setSelectedUser(
                        selectedUser === user.ID ? null : user.ID
                      )
                    }
                  >
                    {user.LAST_NAME} {user.NAME} {user.SECOND_NAME}
                  </div>
                  {selectedUser === user.ID && (
                    <div className={style.userContent}>
                       {userInfo(user)}
                    </div>
                  )}
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Отображение индикатора загрузки, пока данные не получены
  if (loading) {
    return <div className={style.loader}>Загрузка списка департаментов и сотрудников...</div>;
  }

  // Основной рендеринг компонента
  return (
    <div className={style.container}>
      <div className={style.sidebar}>
        <div
          className={style.details__title}
          onClick={handleToggle}
          style={{ cursor: "pointer" }}
        >
          Отделы
        </div>
        <button className={style.refreshButton} onClick={handleRefresh}><p className={style.refreshButtonText}>Обновить данные</p></button>
      </div>
      {isOpen && (
        <div className={style.content}>
          <input
        className={style.text_field__input}
        placeholder="Введите отдел, имя сотрудника или его ID"
        type="search"
        onChange={(e) => {
          setSearchQuery(e.target.value);
          handleSearch(e.target.value);
        }}
        value={searchQuery}
      />
      {searchQuery === "" ? (
        departments.map(renderDepartment)
      ) : isSearching ? (
        <div className={style.loader}>Searching...</div>
      ) : filteredDepartments.length > 0 ? (
        filteredDepartments.map(({ department, users }) =>
          renderSearchResults(department, users)
        )
      ) : (
        <p className={style.not_found}>Ничего не найдено</p>
      )}
        </div>
      )}
    </div>
  );
};

export default Departments;
