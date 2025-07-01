"use client";

export function Header() {
  return (
    <header className="absolute top-0 w-full flex items-center justify-between p-4 z-10">
      <span className="hidden md:block text-sm font-medium">
        github-code-reviewer.run
      </span>

      <nav className="md:mt-2">
        <ul className="flex items-center gap-4">
          <li>
            <a
              href={process.env.NEXT_PUBLIC_APP_URL}
              className="text-sm px-4 py-2 bg-primary text-secondary rounded-full font-medium"
            >
              Sign in
            </a>
          </li>
          <li>
            <a
              href="https://github.com/daniiprietoo/github-code-reviewer"
              className="text-sm px-4 py-2 bg-primary text-secondary rounded-full font-medium"
            >
              Github
            </a>
          </li>
          {/* <li>
            <Dialog>
              <DialogTrigger
                className="text-sm px-4 py-2 bg-secondary text-primary rounded-full font-medium cursor-pointer"
                asChild
              >
                <span>Get updates</span>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Stay updated</DialogTitle>
                  <DialogDescription>
                    Subscribe to our newsletter to get the latest news and
                    updates.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                  <SubscribeForm
                    group="v1-newsletter"
                    placeholder="Email address"
                  />
                </div>
              </DialogContent>
            </Dialog>
          </li> */}
        </ul>
      </nav>
    </header>
  );
}
