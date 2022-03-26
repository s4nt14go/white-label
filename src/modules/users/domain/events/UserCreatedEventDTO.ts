export interface UserCreatedEventDTO {
  dateTimeOccurred: string;
  user: {
    _id: {
      value: string;
    },
    props: {
      email: {
        props: {
          value: string;
        }
      },
      password: {
        props: {
          value: string;
          hashed: boolean;
        }
      },
      username: {
        props: {
          name: string;
        }
      },
      isDeleted: boolean;
      isEmailVerified: boolean;
      isAdminUser: boolean;
    },
  }
}