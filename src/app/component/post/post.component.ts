import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, catchError, of, switchMap, take, tap } from 'rxjs';
import { Post } from 'src/app/interface/Post-interface';
import { Verify } from 'src/app/interface/Verify-interface';
import { LocalStorageService } from 'src/app/service/local-storage.service';
import { PostService } from 'src/app/service/post.service';
import { VerifyService } from '../../service/verify.service';
import { CommentService } from 'src/app/service/comment.service';
import { Comment } from 'src/app/interface/Comment-interface';
import { Router } from '@angular/router';
import { LikePostService } from 'src/app/service/like-post.service';
import { Like } from 'src/app/interface/Like-interface';
import { ImageService } from 'src/app/service/image.service';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent {

  postForm: FormGroup
  allPosts$: Observable<Post[]>;
  verifySave: Verify[];
  commentForm: FormGroup;
  clickedPost: number;
  verifyName: string;
  verifyId: number;
  allComments$: Observable<Comment[]>;
  posts: { [postId: number]: Comment[] } = {};
  postId: number;
  postCountLike: number = 0;
  postCountDislike: number = 0
  likeById: Observable<Like>;
  allLike: Observable<Like[]>
  imageVerName: string;
  toggleCommentForm: boolean = false;
  imageElon: string;
  imageAmel: string;
  imageTwitter: string;
  like: number = 32312;
  dislike: number = 0;
  postsMock: any[] = [
    { id: 1, likes: 233199, dislikes: 0 },
    { id: 2, likes:33, dislikes: 2 },
  ];

  
  constructor(private formBuilder: FormBuilder,
    private localStorage: LocalStorageService,
    private postService: PostService,
    private router: Router,
    private commentService: CommentService,
    private verifyService: VerifyService,
    private likePostService: LikePostService,
    private imageService: ImageService) {

    this.postForm = this.formBuilder.group({
      postText: ['', Validators.required]
    });

    this.commentForm = this.formBuilder.group({
      commentText: ['', Validators.required]
    });
  }

  showComment(){
  this.toggleCommentForm = !this.toggleCommentForm;
  }

  // getLikeOrDislike(postId: number) {
  //  this.postId = postId;
  //   this.likePostService.addLike( this.postCountLike, this.postCountDislike, this.postId, this.verifyId ).pipe(
  //     tap( response =>{
  //     })
  //   ).subscribe(response => {
  //     console.log("subsrcieLike", response);
  //   });
  // };


  getLikeById(): Observable<Like>{
   return this.likeById = this.likePostService.getLikePostById(this.postId).pipe(
    tap( response =>{
      console.log("byIdLike",response);
    })
   )
  };

  getAllLikes(): Observable<Like[]> {
    return this.allLike = this.likePostService.getAllLike().pipe(
      tap(response => {
        console.log("alllikes", response);
      })
    );
  }

  addLike(postId: number) {
    const post = this.postsMock.find(p => p.id === postId);
    if (post) {
      post.likes++;
    }
  }
  
  addDislike(postId: number) {
    const post = this.postsMock.find(p => p.id === postId);
    if (post) {
      post.dislikes++;
    }
  }

  getLikeOrDislike(postId: number) {
    const post = this.postsMock.find(p => p.id === postId);
    if (post) {
      return { likes: post.likes, dislikes: post.dislikes };
    }
    return { likes: 0, dislikes: 0 };
  }


  getClickedPost(postId: number) {
    this.clickedPost = postId;
    console.log("this.cliced", this.clickedPost);
    
  }

  onPost() {
    if (this.postForm.valid) {
      const postText = this.postForm.value.postText;
      const postName = this.localStorage.getLocalStorage('name')
      const id = this.localStorage.getLocalStorage('verifyId');
      this.postService.addPostToNgrx(postText);
      this.postService.addPost(postText, postName, id).pipe(
        tap(response => {
          const postId = response.id
          this.localStorage.setLocalStorage('postId',postId)
        }),
         catchError( (error) => {
          console.log("errorPost", error);
          alert("Morate prvo popuniti informacije o vama!");
          this.router.navigate(['/verify']);
          return of([])
         }),
        switchMap(() => this.allPosts()),
      ).subscribe(posts => {
        console.log("posts", posts);
      })
    }
  };

  onComment() {
    if (this.commentForm.valid) {
      const commentText = this.commentForm.value.commentText;
      const verId = this.localStorage.getLocalStorage('verifyId');
      this.postId = this.clickedPost;
      this.commentService.addCommentToNgrx(commentText);
      this.commentService.addComment(commentText, this.verifyName, this.postId, verId).pipe(
        tap(response => {
        }),
        switchMap(() => this.allComments()),
        catchError((error) => {
          console.log("eror", error);
          return of([]);
        })
      ).subscribe();

    }
  }

  allComments(): Observable<Comment[]> {
    return this.allComments$ = this.commentService.getAllComments().pipe(
      tap(comments => {
        console.log(comments);
        comments.forEach(comment => {
          const postId = comment.postId;
       
          if (postId in this.posts) {
            const existingComments = this.posts[postId];
            //existence two indentic comment in one post
            //no reply comment
            if (!existingComments.some(c => c.id === comment.id)) {
              existingComments.push(comment);
            }
          } else {
            this.posts[postId] = [comment];
          }
        });
      }),
      catchError(error => {
        console.log("error", error);
        return of([]);
      })
    );
  }

  allPosts(): Observable<Post[]> {
    return this.allPosts$ = this.postService.getAllPosts().pipe(
      catchError((error) => {
        console.log("error", error);
        return of();
      })
    )
  }

  getVerifyByUserName(): Observable<Verify>{
    return this.verifyService.getByVerifyName(this.verifyName).pipe(
      tap( response =>{})
    )
  }

  getVerifyById(): Observable<Verify>{
    return this.verifyService.getVerifybyId(this.verifyId).pipe(
      tap ( response => {
      })
    )
  };

  //image

  getName(){
    this.imageService.getImageByName(this.verifyName).subscribe(
      (response: any) => {
        this.imageVerName = 'data:image/jpeg;base64,' + response;
      },
      (error) => {
        console.error('Error retrieving image:', error);
      }
    )
  }
  getName3(){
    const verifyName: string = "Elon" 
    this.imageService.getImageByName(verifyName).subscribe(
      (response: any) => {
        this.imageElon = 'data:image/jpeg;base64,' + response;
      },
      (error) => {
        console.error('Error retrieving image:', error);
      }
    )
  }
  getName1(){
    const verifyName: string = "Amel"
    this.imageService.getImageByName(verifyName).subscribe(
      (response: any) => {
        this.imageAmel = 'data:image/jpeg;base64,' + response;
      },
      (error) => {
        console.error('Error retrieving image:', error);
      }
    )
  }
  getName2(){
    const verifyName: string = "Twitter"
    this.imageService.getImageByName(verifyName).subscribe(
      (response: any) => {
        this.imageTwitter = 'data:image/jpeg;base64,' + response;
      },
      (error) => {
        console.error('Error retrieving image:', error);
      }
    )
  }

  ngOnInit(): void {

    this.verifyName = this.localStorage.getLocalStorage("name")

    this.getName(); 
    this.getName3();
    this.getName2();
    this.getName1();

    this.getAllLikes().subscribe(res =>{
      console.log("alllIKEsUBS",res);
    })
  
    this.getVerifyByUserName().subscribe( byVerify =>{
      this.verifyId = byVerify.id;
      this.localStorage.setLocalStorage("verifyId", this.verifyId)    
    })

    this.allPosts().subscribe(posts => console.log("allPosts", posts));

    this.allComments().subscribe();
    
    this.getVerifyById().subscribe()
  
}
}

