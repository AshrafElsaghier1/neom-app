import { useTheme } from "next-themes";
import Image from "next/image";

const ImageLogo = () => {
  const { theme } = useTheme();

  return theme === "dark" ? (
    <Image
      src="/assets/images/logo-dark.png"
      alt="NEOM Lumi"
      width={300}
      height={150}
      className="  mx-auto  "
      draggable="false"
    />
  ) : (
    <Image
      src="/assets/images/logo.png"
      alt="NEOM Lumi"
      width={300}
      height={150}
      className="  mx-auto  "
      draggable="false"
    />
  );
};

export default ImageLogo;
