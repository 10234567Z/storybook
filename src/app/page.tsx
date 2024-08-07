"use client";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "./components/navbar";
import PostCard from "./components/postCard";
import Image from "next/image";

export default function Page() {
  const supabase = createClient();

  const [signedIn, setSignedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [updating, setUpdating] = useState<boolean>(false);

  const router = useRouter();


  async function getRandomPosts() {
    setUpdating(true)
    const { data, error } = await supabase.from("posts").select("*").order("i_at", { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setPosts(data);
    }
    setUpdating(false)
  }

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user: session },
      } = await supabase.auth.getUser();
      if (session) {
        setSignedIn(true);
        setLoading(false);
      } else {
        setSignedIn(false);
        router.push("/login");
      }
    }
    getRandomPosts()
    checkSession();
  }, []);

  supabase.channel('Update_Home_Page').on(
    'postgres_changes',
    {
      event: "UPDATE",
      schema: "public",
      table: "posts",
    },
    (payload) => {
      getRandomPosts()
    }).subscribe()

  return loading ? (
    <div className="flex w-screen h-screen justify-center items-center">
      <Image src="/loading.svg" width={100} height={100} alt="Loading" />
    </div>
  ) : (
    <>
      <Navbar signedIn={signedIn} />
      {signedIn ? (
        <div className="w-screen flex flex-col justify-center items-center gap-8">
          {posts.map((post) => (
            <PostCard key={post.post_id} post={post} updating={updating} />
          ))}
        </div>
      ) : (
        <>
          <h1>Redirecting...</h1>
        </>
      )}
    </>
  );
}
