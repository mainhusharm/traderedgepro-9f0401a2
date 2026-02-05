import { useEffect, useRef, useCallback } from 'react';

export const useNotificationSound = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element with a simple notification sound
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQtAl9/JnadfHEqZ2LmEZ0cjVJ3hwYFmSxpdpeHCdVpQHmak4ryEYVMhZ6nkvohiURVnsOW+imJPE2245b6QY0sTabnkvJdmRwtgvuK3lmlHB2G+4bKWaEgHYb7esppnRQ5ewN6ynGVDB2C/3K2aY0QMXsDbspxiRAhfv9q0m2JHCF/A2rWaYEgGYL/btJlgRgZfv9uymV9GB2C/3LGZXkcJYMDcsZhfRgdgwNyxl19GCF+/3LGYXkYIYL/cspdcRQhgwNyvl11FCGDA262XXEQJYcLbqpVaQwpiwt2ql1lCCmHC3amWV0ILYsLdqZVYQQtiwd2olFdBCmHC3aeUVkEKYsHepZRVPwtiwt+klFU/C2HB3qOTVD4MYsLfo5NTPQxhwt+hkFM8DGPC36CQUjwNY8PgoI9ROg5jw+CfjlE6DmPD4J6OUDkOZMThn41QOQ9kxOGejE44D2TE4p2LTjgQZMTinItNNxBkxOKbi003EWXF45uKTDYRZcXjmoZMNRJlxeOZhko1EmXF45mFSDMTZsbjmIVIMhNnxuOYhEcyE2fH5JeCRzEUZ8fkl4FGMRRox+SXgEYwFWjI5JZ/RS8VaMjklX5ELxZpyOSVfkQtFmnI5JR9Qy0XacjklHxCLBdqyOWTfEIsGGnJ5ZN7QSsYasnlknpAKxlqyeWSekAqGWrJ5ZF5PyoaasrlkHg+KhpqyuWQdz4pG2rK5ZB3PCkba8vlj3Y8KBxrze+ReDsqHGvN8JF3OygeaM3xj3U5KB9tzfGPdDgpH27P8o5zNyoga8/yj3I2KSFuz/KOczYpIm7R846CMSkrcdPziXYvLzJz1PSJdi0xNHXY9YhyKjQ3d9z3h24mODl74fiGayI8PHvf+oNlHD1Bftv6g2QaQEd/1veAYRxARH3Q84BdIUJIesvxflwjREd6zfB8WydFSXrP8HtbKUdKedHweVcrSEp50/F4VStJS3nT8XdSLEpKd9Tyd1IuS0x31PF2US5MTHbV8nVRL05Ndtbzc08wT0921vNyTjFQUHbX9HBOMlFQd9nzcUwyUlB22PRvTTRUUnbY9G9MNFRSdtr1bUo0VFJ22vVrSTVVU3bb9WtINlVTeN32akY1VlV43fZqRjZWVXfe92pFN1dWeN/3Z0M3WFd54PhkQThZWHng+GRBOVpZeuH4Y0E5W1p74vhiQDlaW3vi+GJAO1xbe+P5YD88XF184vhePzxdXXzj+V4+PV1efOP4XT8+Xl994/hcPj5eX37k+Fs9Pl9gfuT4Wj0/YGF/5flZPD5gYX/l+Vg8QGFhgOX5VztAYWKA5vlWO0BiY4Hm+VU6QWNjgef5VDpBY2OB5/pTOUJkZIHn+lI5QmRkgej6UTlDZWWC6PpQOENlZoLo+k84RGZnguj6TjdEZmeC6fpNOEVnaIPp+k04RWhog+n6TDZGaGmE6fpLNUZoaYTq+ko1R2lphOr6STVIammE6vpJNEhqaoXq+kg0SWpqhev6RzRKa2uF6/pGNEpra4br+kU0S2xshuz6RDRMY2l27PpDM0xja3bs+kMzTWNtduz6QjNNY2127PpCM01jbnbs+kEzTmRud+36QDNOZG537fk/M09lbnfu+T8zT2Vvd+75PjNQZW937vk+M1Bkb3jv+T0yUGRweO/5PDJRZnB48Pk8MlFmcHnw+TsyUWZxefH4OjJSZ3F58fk5MVJncXrx+TgxU2hyen/z+DcxU2hzevP4NjFUaHN78/g2MVRodHvz+DUxVWhze/T3NDBVaHR89Pg0MFZpdHz0+DMwVml1fPT4MjBWaXV89fc0MFhndnv19zQvWGh2fPX2My5YaHZ99vYyLllpd3729jEuWml3fvf2MC5aanZ+9/UvL1tqd3749C8vW2p3fvj0Li9ca3d++fQtLl1sdn/69CwuXWx2f/n0Ky1dbXd/+vQrLV5td3/69SstXW14f/r0Kixebnh/+/QpLF5ueID79CksX294gPvzKCtfb3mA+/MnK2BveYD88ycrYHB5gfvyJitgcHmB/PIlKmFxeYH98iUpYXF5gf3yJSlicXqC/fEkKWJyeoL+8SQpYnJ7gv7wIyhic3uD/vAjJ2Jze4P+7yInY3R7hP7uICdkdXuE/u0fJmR1e4T/7R8mZXZ8hf/sHiVld3yF/+sdJWV3fIb/6x0kZnd9hv/qHCRmeH2H/+kcI2Z4fYf/6BsiZ3l9iP/oGyJnenyI/+cbImh6fYj/5hoh');
    audioRef.current.volume = 0.5;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Audio play might fail if user hasn't interacted with page
        console.log('Audio playback failed - user interaction required');
      });
    }
  }, []);

  return { playNotificationSound };
};

export default useNotificationSound;
